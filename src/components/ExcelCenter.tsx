import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  ClipboardPaste, 
  HelpCircle,
  FileDown
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

export const ExcelCenter: React.FC = () => {
  const { visibleContactos, users, pollingStations, contactos } = useApp();
  const [pasteText, setPasteText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getLiderName = (id?: string) => {
    if (!id) return 'N/A';
    const leader = users.find(u => u.id === id);
    if (leader) return leader.nombre_completo;
    const cLeader = contactos.find(c => c.id === id) || visibleContactos.find(c => c.id === id);
    if (cLeader) return `${cLeader.nombres} ${cLeader.apellidos || ''}`.trim();
    return id;
  };

  const getSubliderName = (id?: string, rol?: string, liderId?: string) => {
    if (rol === 'SUBLIDER') return 'NO APLICA';
    if (!id || id === 'DIRECTO' || id === liderId) return 'Directo del Líder';
    const subContacto = contactos.find(c => c.id === id) || visibleContactos.find(c => c.id === id);
    if (subContacto) return `${subContacto.nombres} ${subContacto.apellidos || ''}`.trim();
    const subUser = users.find(u => u.id === id);
    if (subUser) return subUser.nombre_completo;
    return 'NO APLICA';
  };

  const getPuestoName = (id?: string) => {
    if (!id) return 'No asignado';
    const station = pollingStations.find(p => p.id === id);
    if (station) return station.nombre_puesto || (station as any).nombre || 'Desconocido';
    return id;
  };

  const applyStyles = (ws: XLSX.WorkSheet, customWidths?: number[]) => {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    
    // Header styles (Row 1)
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (!ws[address]) {
        ws[address] = { t: 's', v: '' };
      }
      ws[address].s = {
        font: { bold: true, color: { rgb: "000000" } },
        fill: { fgColor: { rgb: "9BC2E6" } }, // Light blue
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }
    
    // Data rows styles and Column widths
    ws['!cols'] = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      ws['!cols'][C] = { wch: customWidths && customWidths[C] ? customWidths[C] : 20 };
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const address = XLSX.utils.encode_col(C) + (R + 1);
        if (!ws[address]) {
          ws[address] = { t: 's', v: '' };
        }
        ws[address].s = {
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }
    }
  };

  const handleDownloadTemplate = () => {
    // Generate a template Excel file
    const templateData = [
      {
        'Nombres': 'Juan',
        'Apellidos': 'Perez',
        'Cédula': '12345678',
        'Teléfono': '3001234567',
        'Género': 'M',
        'Edad': 30,
        'Localidad': '1 - Histórica y del Caribe Norte',
        'Barrio': 'Bocagrande',
        'Puesto de Votacion': '',
        'Mesa': 1
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Custom widths matching the requested design
    const widths = [15, 15, 15, 15, 10, 8, 35, 20, 25, 10];
    applyStyles(ws, widths);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Contactos");
    
    XLSX.writeFile(wb, "Plantilla_Mendozismo.xlsx");
  };

  const handleExportData = () => {
    // Export existing contacts
    const exportData = visibleContactos.map(c => ({
      'Nombres': c.nombres || '',
      'Apellidos': c.apellidos || '',
      'Cédula': c.cedula || '',
      'Teléfono': c.telefono || '',
      'Género': c.genero || '',
      'Edad': c.edad ?? '',
      'Localidad': c.sector_comuna || '',
      'Barrio': c.barrio || '',
      'Puesto de Votacion': getPuestoName(c.puesto_id),
      'Mesa': c.mesa || '',
      'Líder Asignado': getLiderName(c.lider_id),
      'Sublíder Asignado': getSubliderName(c.sublider_id, c.rol, c.lider_id),
      'Estado': c.rol || c.estado || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const exportWidths = [18, 18, 15, 15, 12, 10, 32, 22, 28, 10, 25, 25, 25];
    applyStyles(ws, exportWidths);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contactos_Mendozismo");
    
    XLSX.writeFile(wb, "Exportacion_Contactos_Mendozismo.xlsx");
  };

  const processPastedText = () => {
    if (!pasteText.trim()) return;
    
    const rows = pasteText.split('\n');
    const data = rows.map(row => row.split('\t'));
    
    console.log("Processed pasted data:", data);
    alert(`Se leyeron ${data.length} filas desde el portapapeles. La importación a la base de datos se conectará en el siguiente paso.`);
    setPasteText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (typeof bstr !== 'string' && !(bstr instanceof ArrayBuffer)) return;
      
      const wb = XLSX.read(bstr, { type: typeof bstr === 'string' ? 'binary' : 'array' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      console.log("Processed Excel file:", data);
      alert(`Se leyeron ${data.length} filas del archivo Excel. La importación a la base de datos se conectará en el siguiente paso.`);
    };
    if (file.name.endsWith('.csv')) {
       reader.readAsText(file);
    } else {
       reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Centro de Excel, Plantillas & Migración
            <span className="px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Soporte .XLSX / .CSV
            </span>
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Importa tus hojas de Excel existentes o descarga reportes consolidados del movimiento
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleDownloadTemplate}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 text-sm font-bold transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Descargar Plantilla Excel</span>
          </button>
          <button
            onClick={handleExportData}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-900/20 transition flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar a Excel ({visibleContactos.length})</span>
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-neutral-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-2xl p-5 shadow-lg shadow-indigo-900/10">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-indigo-300">¿Cómo anexar tus archivos de Excel al sistema?</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-neutral-950/50 border border-neutral-800/80 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">1</span>
              <h4 className="text-sm font-bold text-neutral-200">Opción A: Arrastrar o Cargar tu Archivo Aquí</h4>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed pl-7">
              Usa el cuadro de abajo para seleccionar tu archivo Excel (.xlsx, .xls o .csv). El sistema detectará automáticamente las columnas de cédula, nombres, teléfono, puesto y barrio.
            </p>
          </div>
          <div className="bg-neutral-950/50 border border-neutral-800/80 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">2</span>
              <h4 className="text-sm font-bold text-neutral-200">Opción B: Copiar y Pegar Directo de Excel</h4>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed pl-7">
              Abre tu hoja de Excel, selecciona las celdas con el mouse, presiona <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-300 font-mono text-[10px]">Ctrl+C</kbd> y pégalas en la pestaña "Pegar Celdas" sin necesidad de guardar el archivo.
            </p>
          </div>
        </div>
      </div>

      {/* Main Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upload File Zone */}
        <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/80 rounded-3xl p-6 shadow-xl shadow-black/20 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-neutral-100">Cargar Archivo Excel (.xlsx / .csv)</h2>
          </div>
          <p className="text-xs text-neutral-400 mb-6">
            Selecciona tu archivo original con los simpatizantes o líderes del movimiento.
          </p>
          
          <div 
            className="flex-1 border-2 border-dashed border-neutral-700/70 hover:border-emerald-500/50 bg-neutral-950/50 rounded-2xl flex flex-col items-center justify-center p-8 transition cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".xlsx,.xls,.csv" 
              onChange={handleFileUpload}
            />
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-500/20 transition">
              <FileDown className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-neutral-200 text-center mb-1">Haz clic aquí para buscar tu archivo Excel</h3>
            <p className="text-xs text-neutral-500 text-center">Archivos compatibles: .xlsx, .xls, .csv</p>
          </div>
        </div>

        {/* Paste Text Zone */}
        <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/80 rounded-3xl p-6 shadow-xl shadow-black/20 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardPaste className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-neutral-100">Pegar Filas Directo desde Excel</h2>
          </div>
          <p className="text-xs text-neutral-400 mb-6">
            Copia filas en Excel y pégalas aquí directamente (con encabezados).
          </p>
          
          <div className="flex-1 flex flex-col gap-4">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="flex-1 w-full bg-[#09090b] border border-neutral-800 text-neutral-300 text-xs p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none font-mono min-h-[200px]"
              placeholder="Pega aquí las filas copiadas desde Excel..."
            />
            <button
              onClick={processPastedText}
              disabled={!pasteText.trim()}
              className="w-full py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold transition flex items-center justify-center gap-2"
            >
              <span>Procesar Texto Copiado</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
