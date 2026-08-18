import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  ArrowRight,
  ClipboardPaste,
  HelpCircle,
  Vote,
  Users,
} from 'lucide-react';
import { getAgeBracket, formatCedula } from '../utils/helpers';
import { Gender, VotingCommitment, Supporter } from '../types';

export const ExcelManager: React.FC = () => {
  const {
    supporters,
    visibleSupporters,
    users,
    pollingStations,
    bulkAddSupporters,
    currentUser,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({});
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [importResult, setImportResult] = useState<{ added: number; duplicates: number; duplicateCedulas: string[] } | null>(null);
  const [pasteData, setPasteData] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Target schema fields for mapping
  const targetFields = [
    { key: 'cedula', label: 'Cédula de Ciudadanía *', required: true, matchKeys: ['cedula', 'cc', 'documento', 'identificacion', 'cédula', 'doc'] },
    { key: 'firstName', label: 'Nombres *', required: true, matchKeys: ['nombre', 'nombres', 'primer nombre', 'first name', 'firstname'] },
    { key: 'lastName', label: 'Apellidos *', required: true, matchKeys: ['apellido', 'apellidos', 'segundo nombre', 'last name', 'lastname'] },
    { key: 'phone', label: 'Teléfono Móvil (WhatsApp) *', required: true, matchKeys: ['telefono', 'teléfono', 'celular', 'whatsapp', 'movil', 'móvil', 'phone'] },
    { key: 'email', label: 'Correo Electrónico', required: false, matchKeys: ['correo', 'email', 'e-mail', 'mail'] },
    { key: 'gender', label: 'Género (F/M)', required: false, matchKeys: ['genero', 'género', 'sexo', 'gender'] },
    { key: 'age', label: 'Edad', required: false, matchKeys: ['edad', 'años', 'age'] },
    { key: 'neighborhood', label: 'Barrio', required: false, matchKeys: ['barrio', 'vecindario', 'neighborhood'] },
    { key: 'sector', label: 'Sector / Comuna', required: false, matchKeys: ['sector', 'comuna', 'zona', 'localidad'] },
    { key: 'pollingStationName', label: 'Puesto de Votación', required: false, matchKeys: ['puesto', 'colegio', 'puesto de votacion', 'puesto de votación', 'lugar de votacion', 'recinto'] },
    { key: 'tableNumber', label: 'Mesa', required: false, matchKeys: ['mesa', 'mesa de votacion', 'mesa de votación', 'table'] },
    { key: 'registeredByLeaderName', label: 'Líder Responsable', required: false, matchKeys: ['lider', 'líder', 'lider responsable', 'coordinador'] },
    { key: 'registeredBySubleaderName', label: 'Sublíder Responsable', required: false, matchKeys: ['sublider', 'sublíder', 'activista'] },
    { key: 'votingCommitment', label: 'Compromiso de Voto', required: false, matchKeys: ['compromiso', 'estado', 'voto'] },
  ];

  // Auto-map headers
  const autoMapColumns = (headers: string[]) => {
    const mapping: { [key: string]: string } = {};
    headers.forEach((header) => {
      const cleanHeader = header.toLowerCase().trim();
      for (const target of targetFields) {
        if (target.matchKeys.some(mk => cleanHeader.includes(mk) || mk === cleanHeader)) {
          if (!Object.values(mapping).includes(target.key)) {
            mapping[header] = target.key;
            break;
          }
        }
      }
    });
    setColumnMapping(mapping);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setImportResult(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (data.length < 2) {
          setErrorMsg('El archivo está vacío o no contiene suficientes filas.');
          setIsProcessing(false);
          return;
        }

        const headers = (data[0] || []).map((h: any) => String(h || '').trim()).filter(Boolean);
        const rows = data.slice(1).filter(r => r.some((cell: any) => cell !== undefined && cell !== ''));

        setFileHeaders(headers);
        setParsedRows(rows);
        autoMapColumns(headers);
      } catch (err) {
        console.error(err);
        setErrorMsg('Error al leer el archivo Excel. Asegúrate de que sea un archivo válido (.xlsx, .xls o .csv).');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Handle Tab-Separated Paste directly from Excel
  const handlePasteData = () => {
    setErrorMsg('');
    setImportResult(null);
    if (!pasteData.trim()) return;

    try {
      const lines = pasteData.trim().split(/\r?\n/).map(line => line.split('\t'));
      if (lines.length < 2) {
        setErrorMsg('Por favor copia y pega por lo menos la fila de encabezados y una fila de datos desde Excel.');
        return;
      }

      const headers = lines[0].map(h => h.trim());
      const rows = lines.slice(1);

      setFileName('Datos Pegados desde Portapapeles');
      setFileHeaders(headers);
      setParsedRows(rows);
      autoMapColumns(headers);
    } catch (err) {
      setErrorMsg('Error al procesar el texto copiado.');
    }
  };

  // Confirm Import
  const handleConfirmImport = () => {
    setErrorMsg('');

    // Check required fields mapped
    const mappedTargetKeys = Object.values(columnMapping);
    const missingRequired = targetFields
      .filter(tf => tf.required)
      .filter(tf => !mappedTargetKeys.includes(tf.key));

    if (missingRequired.length > 0) {
      setErrorMsg(`Faltan campos obligatorios por mapear: ${missingRequired.map(f => f.label).join(', ')}.`);
      return;
    }

    const newSupporters: Array<Omit<Supporter, 'id' | 'createdAt'>> = [];

    parsedRows.forEach((row) => {
      const rowObj: { [key: string]: any } = {};
      fileHeaders.forEach((header, index) => {
        const targetKey = columnMapping[header];
        if (targetKey) {
          rowObj[targetKey] = row[index];
        }
      });

      const rawCedula = String(rowObj['cedula'] || '').replace(/\D/g, '');
      if (!rawCedula) return;

      const rawName = String(rowObj['firstName'] || '').trim();
      const rawLastName = String(rowObj['lastName'] || '').trim() || 'General';
      const rawPhone = String(rowObj['phone'] || '').trim() || '3000000000';
      const rawAge = Number(rowObj['age']) || 30;
      let rawGender: Gender = 'FEMENINO';
      const gStr = String(rowObj['gender'] || '').toUpperCase();
      if (gStr.startsWith('M') || gStr.includes('HOMB')) rawGender = 'MASCULINO';
      if (gStr.startsWith('O')) rawGender = 'OTRO';

      const stationName = String(rowObj['pollingStationName'] || '').trim() || 'I.E. Normal Superior San Pedro';
      const station = pollingStations.find(ps => ps.name.toLowerCase().includes(stationName.toLowerCase())) || pollingStations[0];

      let commitment: VotingCommitment = 'CONFIRMADO';
      const cStr = String(rowObj['votingCommitment'] || '').toUpperCase();
      if (cStr.includes('PEND')) commitment = 'PENDIENTE';
      if (cStr.includes('CONT')) commitment = 'POR_CONTACTAR';
      if (cStr.includes('DUD')) commitment = 'DUDOSO';

      newSupporters.push({
        cedula: rawCedula,
        firstName: rawName,
        lastName: rawLastName,
        phone: rawPhone,
        email: rowObj['email'] ? String(rowObj['email']).trim() : undefined,
        gender: rawGender,
        age: rawAge,
        ageBracket: getAgeBracket(rawAge),
        neighborhood: rowObj['neighborhood'] ? String(rowObj['neighborhood']).trim() : 'Barrio General',
        sector: rowObj['sector'] ? String(rowObj['sector']).trim() : (station ? station.zone : 'Comuna General'),
        pollingStationId: station ? station.id : 'ps-1',
        pollingStationName: station ? station.name : stationName,
        tableNumber: rowObj['tableNumber'] ? String(rowObj['tableNumber']).trim() : undefined,
        registeredByLeaderId: currentUser?.role === 'LIDER_COORDINADOR' ? currentUser.id : 'user-leader-1',
        registeredByLeaderName: rowObj['registeredByLeaderName'] ? String(rowObj['registeredByLeaderName']).trim() : (currentUser?.fullName || 'Carlos Mendoza'),
        registeredBySubleaderId: currentUser?.role === 'SUBLIDER' ? currentUser.id : undefined,
        registeredBySubleaderName: rowObj['registeredBySubleaderName'] ? String(rowObj['registeredBySubleaderName']).trim() : (currentUser?.role === 'SUBLIDER' ? currentUser.fullName : undefined),
        votingCommitment: commitment,
        contactedViaWhatsapp: false,
        votedStatus: false,
      });
    });

    const result = bulkAddSupporters(newSupporters);
    setImportResult(result);

    if (result.added > 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    setParsedRows([]);
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Cédula': '1037589210',
        'Nombres': 'Andrés Felipe',
        'Apellidos': 'Restrepo Giraldo',
        'Teléfono (WhatsApp)': '3104567890',
        'Correo': 'andres.restrepo@gmail.com',
        'Género': 'Masculino',
        'Edad': 28,
        'Barrio': 'La Pradera',
        'Sector/Comuna': 'Comuna 1 - Norte',
        'Puesto de Votación': 'I.E. Normal Superior San Pedro',
        'Mesa': '04',
        'Líder Responsable': 'Carlos Mendoza',
        'Sublíder': 'María Fernanda Gómez',
        'Compromiso': 'Confirmado',
      },
      {
        'Cédula': '43987654',
        'Nombres': 'Luz Helena',
        'Apellidos': 'Valencia Montoya',
        'Teléfono (WhatsApp)': '3128765432',
        'Correo': 'luz.valencia@hotmail.com',
        'Género': 'Femenino',
        'Edad': 52,
        'Barrio': 'El Centro',
        'Sector/Comuna': 'Comuna 2 - Centro',
        'Puesto de Votación': 'I.E. Santander Principal',
        'Mesa': '11',
        'Líder Responsable': 'Patricia Vargas',
        'Sublíder': 'Elena Castro Rivas',
        'Compromiso': 'Confirmado',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Votantes');
    XLSX.writeFile(wb, 'Plantilla_Sipol_Personas_de_Apoyo.xlsx');
  };

  // Export current database to Excel
  const handleExportData = () => {
    const exportRows = visibleSupporters.map(s => ({
      'Cédula': s.cedula,
      'Nombres': s.firstName,
      'Apellidos': s.lastName,
      'WhatsApp / Teléfono': s.phone,
      'Correo': s.email || '',
      'Género': s.gender,
      'Edad': s.age,
      'Rango de Edad': s.ageBracket,
      'Barrio': s.neighborhood,
      'Sector / Comuna': s.sector,
      'Puesto de Votación': s.pollingStationName,
      'Mesa': s.tableNumber || '',
      'Líder': s.registeredByLeaderName,
      'Sublíder': s.registeredBySubleaderName || '',
      'Compromiso Voto': s.votingCommitment,
      'Contactado WhatsApp': s.contactedViaWhatsapp ? 'SÍ' : 'NO',
      'Votó (Día D)': s.votedStatus ? 'SÍ' : 'NO',
      'Fecha Registro': s.createdAt,
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Simpatizantes');

    // Add Polling Stations Sheet
    const psRows = pollingStations.map(ps => ({
      'Código': ps.code,
      'Puesto': ps.name,
      'Zona / Comuna': ps.zone,
      'Barrio': ps.neighborhood,
      'Dirección': ps.address,
      'Mesas': ps.tablesCount,
      'Meta Votantes': ps.targetVoters,
      'Coordinador': ps.coordinatorName || '',
      'Teléfono Coordinador': ps.coordinatorPhone || '',
    }));
    const wsPs = XLSX.utils.json_to_sheet(psRows);
    XLSX.utils.book_append_sheet(wb, wsPs, 'Puestos de Votación');

    XLSX.writeFile(wb, `Reporte_Electoral_Sipol_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-100">
              Centro de Excel, Plantillas & Migración
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Soporte .XLSX / .CSV
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Importa tus hojas de Excel existentes o descarga reportes consolidados del movimiento
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Descargar Plantilla Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportData}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar a Excel ({visibleSupporters.length})</span>
          </button>
        </div>
      </div>

      {/* User FAQ Guidance Card: "¿Cómo anexo mis hojas de Excel?" */}
      <div className="p-5 rounded-3xl bg-neutral-900/90 border border-indigo-900/40 space-y-3 shadow-sm">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
          <HelpCircle className="w-4 h-4" />
          <span>¿Cómo anexar tus archivos de Excel al sistema?</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-neutral-300">
          <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-1.5">
            <span className="font-semibold text-neutral-100 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
              Opción A: Arrastrar o Cargar tu Archivo Aquí
            </span>
            <p className="text-neutral-400 text-[11px]">
              Usa el cuadro de abajo para seleccionar tu archivo Excel (<code>.xlsx</code>, <code>.xls</code> o <code>.csv</code>). El sistema detectará automáticamente las columnas de cédula, nombres, teléfono, puesto y barrio.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-1.5">
            <span className="font-semibold text-neutral-100 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
              Opción B: Copiar y Pegar Directo de Excel
            </span>
            <p className="text-neutral-400 text-[11px]">
              Abre tu hoja de Excel, selecciona las celdas con el mouse, presiona <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-[10px] text-neutral-200">Ctrl+C</kbd> y pégalas en la pestaña "Pegar Celdas" sin necesidad de guardar el archivo.
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {importResult && (
        <div className="p-5 rounded-3xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>¡Importación completada exitosamente!</span>
          </div>
          <div className="text-neutral-300">
            Se registraron <strong className="text-emerald-400">{importResult.added} nuevas personas de apoyo</strong> en la base de datos.
            {importResult.duplicates > 0 && (
              <span className="text-amber-300 ml-1">
                ({importResult.duplicates} cédulas fueron omitidas porque ya estaban registradas para evitar duplicados).
              </span>
            )}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Uploader / Paste Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upload Box */}
        <div className="p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Cargar Archivo Excel (.xlsx / .csv)</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Selecciona tu archivo original con los simpatizantes o líderes del movimiento.
            </p>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-700 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer transition bg-neutral-950/50 hover:bg-neutral-950 space-y-3"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-neutral-200">
                Haz clic aquí para buscar tu archivo Excel
              </span>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Archivos compatibles: .xlsx, .xls, .csv
              </p>
            </div>
          </div>
        </div>

        {/* Paste from Excel Box */}
        <div className="p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              <ClipboardPaste className="w-4 h-4 text-indigo-400" />
              <span>Pegar Filas Directo desde Excel</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Copia filas en Excel y pégalas aquí directamente (con encabezados).
            </p>
          </div>

          <textarea
            rows={4}
            value={pasteData}
            onChange={(e) => setPasteData(e.target.value)}
            placeholder="Pega aquí las filas copiadas desde Excel..."
            className="w-full p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-xs font-mono text-neutral-200 focus:border-indigo-500 transition"
          />

          <button
            type="button"
            onClick={handlePasteData}
            disabled={!pasteData.trim()}
            className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition disabled:opacity-50 cursor-pointer"
          >
            Procesar Texto Copiado
          </button>
        </div>
      </div>

      {/* Column Mapping & Preview Section when a file is loaded */}
      {parsedRows.length > 0 && (
        <div className="p-6 rounded-3xl bg-neutral-900/95 border border-indigo-500/40 space-y-5 shadow-xl animate-in fade-in zoom-in-95">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div>
              <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Asistente de Mapeo de Columnas ({fileName})</span>
              </h2>
              <p className="text-xs text-neutral-400">
                Se detectaron {parsedRows.length} filas. Verifica qué columna de tu Excel corresponde a cada campo:
              </p>
            </div>

            <button
              type="button"
              onClick={handleConfirmImport}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <span>Confirmar & Importar {parsedRows.length} Personas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mapping Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {fileHeaders.map((header) => {
              const currentTarget = columnMapping[header] || '';
              return (
                <div
                  key={header}
                  className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-1.5"
                >
                  <div className="text-[11px] font-bold text-neutral-300 truncate">
                    Columna Excel: <span className="text-emerald-400 font-mono">"{header}"</span>
                  </div>
                  <select
                    value={currentTarget}
                    onChange={(e) => setColumnMapping(prev => ({ ...prev, [header]: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-100"
                  >
                    <option value="">-- No Importar esta Columna --</option>
                    {targetFields.map((tf) => (
                      <option key={tf.key} value={tf.key}>
                        {tf.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          {/* Preview Table of First 5 rows */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-neutral-300">
              Vista previa de las primeras filas:
            </div>
            <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 text-[11px]">
                  <tr>
                    {fileHeaders.map(h => (
                      <th key={h} className="py-2.5 px-3 whitespace-nowrap">
                        {h} {columnMapping[h] ? `→ [${columnMapping[h]}]` : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                  {parsedRows.slice(0, 5).map((row, rIdx) => (
                    <tr key={rIdx}>
                      {fileHeaders.map((_, cIdx) => (
                        <td key={cIdx} className="py-2 px-3 whitespace-nowrap text-[11px]">
                          {String(row[cIdx] || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
