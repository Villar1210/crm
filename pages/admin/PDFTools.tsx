import React, { useState } from 'react';
import {
  FileText, Scissors, Minimize2, Image, FileType, Layers,
  PenTool, Lock, Unlock, RefreshCw, Download,
  UploadCloud, ArrowRight, ScanLine, RotateCw, Trash2, Stamp, Hash
} from 'lucide-react';
import { api } from '../../services/api';

const PDFTools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'organize' | 'convert' | 'optimize' | 'security' | 'edit'>('all');

  // File State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Tool specific inputs
  const [password, setPassword] = useState('');
  const [rotationAngle, setRotationAngle] = useState<90 | 180 | 270>(90);
  const [pagesToDelete, setPagesToDelete] = useState('');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');

  const tools = [
    // Organize
    { id: 'merge', title: 'Juntar PDF', desc: 'Mesclar vários PDFs em um só.', icon: Layers, color: 'text-red-600', category: 'organize' },
    { id: 'split', title: 'Dividir PDF', desc: 'Extrair páginas de um PDF.', icon: Scissors, color: 'text-red-600', category: 'organize' },
    { id: 'delete-pages', title: 'Excluir Páginas', desc: 'Remover páginas indesejadas.', icon: Trash2, color: 'text-red-600', category: 'organize' },
    // { id: 'organize', title: 'Organizar PDF', desc: 'Reordenar páginas.', icon: ScanLine, color: 'text-red-600', category: 'organize', comingSoon: true },
    { id: 'rotate', title: 'Girar PDF', desc: 'Girar páginas do PDF.', icon: RotateCw, color: 'text-red-600', category: 'organize' },

    // Convert (PDF to...)
    { id: 'start-ocr', title: 'OCR PDF', desc: 'Reconhecer texto em PDF digitalizado.', icon: ScanLine, color: 'text-blue-600', category: 'convert' },
    { id: 'pdf-to-word', title: 'PDF para Word', desc: 'Converter PDF para DOCX.', icon: FileText, color: 'text-blue-600', category: 'convert' },
    { id: 'pdf-to-excel', title: 'PDF para Excel', desc: 'Converter tabelas PDF para XLSX.', icon: FileType, color: 'text-blue-600', category: 'convert' },
    { id: 'pdf-to-ppt', title: 'PDF para Powerpoint', desc: 'Converter PDF para PPTX.', icon: FileType, color: 'text-blue-600', category: 'convert' },
    { id: 'pdf-to-jpg', title: 'PDF para JPG', desc: 'Extrair imagens do PDF.', icon: Image, color: 'text-blue-600', category: 'convert' },

    // Convert (To PDF)
    { id: 'word-to-pdf', title: 'Word para PDF', desc: 'DOCX para PDF.', icon: FileText, color: 'text-blue-600', category: 'convert' },
    { id: 'excel-to-pdf', title: 'Excel para PDF', desc: 'XLSX para PDF.', icon: FileType, color: 'text-blue-600', category: 'convert' },
    { id: 'ppt-to-pdf', title: 'Powerpoint para PDF', desc: 'PPTX para PDF.', icon: FileText, color: 'text-blue-600', category: 'convert' },
    { id: 'images-to-pdf', title: 'JPG para PDF', desc: 'Converter imagens para PDF.', icon: Image, color: 'text-blue-600', category: 'convert' },

    // Optimize
    { id: 'compress', title: 'Comprimir PDF', desc: 'Reduzir tamanho do arquivo.', icon: Minimize2, color: 'text-green-600', category: 'optimize' },
    { id: 'repair', title: 'Reparar PDF', desc: 'Corrigir PDFs corrompidos.', icon: RefreshCw, color: 'text-green-600', category: 'optimize' },

    // Security
    { id: 'protect', title: 'Proteger PDF', desc: 'Adicionar senha ao PDF.', icon: Lock, color: 'text-purple-600', category: 'security' },
    { id: 'unlock', title: 'Desbloquear PDF', desc: 'Remover segurança do PDF.', icon: Unlock, color: 'text-purple-600', category: 'security' },
    { id: 'sign', title: 'Assinar PDF', desc: 'Adicionar assinatura digital.', icon: PenTool, color: 'text-purple-600', category: 'security' },

    // Edit
    { id: 'watermark', title: 'Marca d\'água', desc: 'Estampar imagem ou texto.', icon: Stamp, color: 'text-gray-600', category: 'edit' },
    { id: 'page-numbers', title: 'Números de Página', desc: 'Adicionar numeração.', icon: Hash, color: 'text-gray-600', category: 'edit' },
  ];

  const filteredTools = activeTab === 'all' ? tools : tools.filter(t => t.category === activeTab);

  const handleToolClick = (toolId: string, isComingSoon?: boolean) => {
    if (isComingSoon) return alert('Em breve!');
    setActiveTool(toolId);
    setIsProcessing(false);
    setIsCompleted(false);
    setSelectedFiles([]);
    setDownloadUrl(null);
    setPassword('');
    setRotationAngle(90);
    setPagesToDelete('');
    setWatermarkText('CONFIDENTIAL');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleProcess = async () => {
    if (selectedFiles.length === 0) return alert('Selecione arquivos primeiro.');
    setIsProcessing(true);
    try {
      let blob: Blob | null = null;
      const file = selectedFiles[0]; // Most ops use single file

      if (activeTool === 'merge') {
        if (selectedFiles.length < 2) throw new Error('Selecione pelo menos 2 arquivos.');
        blob = await api.pdf.merge(selectedFiles);
      } else if (activeTool === 'split') {
        blob = await api.pdf.split(file, 'all');
      } else if (activeTool === 'images-to-pdf') {
        blob = await api.pdf.imagesToPdf(selectedFiles);
      } else if (activeTool === 'rotate') {
        blob = await api.pdf.rotate(file, rotationAngle);
      } else if (activeTool === 'protect') {
        if (!password) throw new Error('Senha necessária');
        if (!password) throw new Error('Senha necessária');
        blob = await api.pdf.protect(file, password);
      } else if (activeTool === 'sign') {
        if (selectedFiles.length < 2) throw new Error('Selecione o PDF e a imagem da assinatura.');
        blob = await api.pdf.sign(selectedFiles);
      } else if (activeTool === 'unlock') {
        blob = await api.pdf.unlock(file, password);
      } else if (activeTool === 'delete-pages') {
        if (!pagesToDelete) throw new Error('Indique as páginas a excluir');
        blob = await api.pdf.deletePages(file, pagesToDelete);
      } else if (activeTool === 'watermark') {
        blob = await api.pdf.watermark(file, watermarkText);
      } else if (activeTool === 'page-numbers') {
        blob = await api.pdf.pageNumbers(file);
      } else if (activeTool === 'compress') { // New Handlers
        blob = await api.pdf.compress(file);
      } else if (activeTool === 'repair') {
        blob = await api.pdf.repair(file);
      } else if (activeTool === 'start-ocr') {
        blob = await api.pdf.ocr(file);
      } else if (activeTool === 'word-to-pdf') {
        blob = await api.pdf.wordToPdf(file);
      } else if (activeTool === 'excel-to-pdf') {
        blob = await api.pdf.excelToPdf(file);
      } else if (activeTool === 'ppt-to-pdf') {
        blob = await api.pdf.pptToPdf(file);
      } else if (activeTool === 'pdf-to-word') {
        blob = await api.pdf.pdfToWord(file);
      } else if (activeTool === 'pdf-to-excel') {
        blob = await api.pdf.pdfToExcel(file);
      } else if (activeTool === 'pdf-to-ppt') {
        blob = await api.pdf.pdfToPpt(file);
      } else if (activeTool === 'pdf-to-jpg') {
        blob = await api.pdf.pdfToJpg(file);
      }

      if (blob) {
        const url = window.URL.createObjectURL(blob);
        setDownloadUrl(url);
        setIsCompleted(true);
      }
    } catch (error: any) {
      console.error(error);
      alert('Erro ao processar: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setActiveTool(null);
    setIsProcessing(false);
    setIsCompleted(false);
    setSelectedFiles([]);
    setDownloadUrl(null);
  };

  const getActiveToolData = () => tools.find(t => t.id === activeTool);

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in px-4">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-serif font-bold text-gray-900 flex items-center justify-center gap-3">
          <span className="text-red-500">Evilar</span> PDF
        </h2>
        <p className="text-gray-500 mt-2 text-lg">
          Todas as ferramentas para seus documentos imobiliários.
        </p>
      </div>

      {!activeTool ? (
        <>
          {/* Category Tabs */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'organize', label: 'Organizar' },
              { id: 'convert', label: 'Converter' },
              { id: 'optimize', label: 'Otimizar' },
              { id: 'security', label: 'Segurança' },
              { id: 'edit', label: 'Editar' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id, (tool as any).comingSoon)}
                className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-all text-center group h-full
                    ${(tool as any).comingSoon
                    ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                    : 'bg-white border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-red-100'}`}
              >
                <div className={`${tool.color} mb-4 transform group-hover:scale-110 transition-transform`}>
                  <tool.icon size={32} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{tool.title}</h3>
                <p className="text-xs text-gray-400 leading-tight line-clamp-2">{tool.desc}</p>
                {(tool as any).comingSoon && (
                  <span className="mt-2 text-[10px] font-bold bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">EM BREVE</span>
                )}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden min-h-[500px] flex flex-col items-center justify-center p-8 relative">
          <button
            onClick={reset}
            className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 flex items-center gap-2 font-bold"
          >
            <ArrowRight size={20} className="rotate-180" /> Voltar
          </button>

          {!isProcessing && !isCompleted && (
            <div className="text-center w-full max-w-2xl animate-fade-in flex flex-col items-center">
              <div className={`w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6 ${getActiveToolData()?.color}`}>
                {React.createElement(getActiveToolData()?.icon || FileText, { size: 40 })}
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">{getActiveToolData()?.title}</h3>
              <p className="text-gray-500 mb-10 text-lg">{getActiveToolData()?.desc}</p>

              {/* Tool Specific Inputs */}

              {activeTool === 'protect' && (
                <div className="mb-8 w-full max-w-sm">
                  <label className="block text-left font-bold text-gray-700 mb-2">Definir Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Digite a senha..."
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-red-500 outline-none"
                  />
                </div>
              )}

              {activeTool === 'unlock' && (
                <div className="mb-8 w-full max-w-sm">
                  <label className="block text-left font-bold text-gray-700 mb-2">Senha do Arquivo (Opcional)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Digite se souber..."
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-red-500 outline-none"
                  />
                </div>
              )}

              {activeTool === 'rotate' && (
                <div className="mb-8 flex gap-4">
                  <button onClick={() => setRotationAngle(90)} className={`px-4 py-2 rounded-lg border ${rotationAngle === 90 ? 'bg-red-50 border-red-500 text-red-600' : 'border-gray-300'}`}>90°</button>
                  <button onClick={() => setRotationAngle(180)} className={`px-4 py-2 rounded-lg border ${rotationAngle === 180 ? 'bg-red-50 border-red-500 text-red-600' : 'border-gray-300'}`}>180°</button>
                  <button onClick={() => setRotationAngle(270)} className={`px-4 py-2 rounded-lg border ${rotationAngle === 270 ? 'bg-red-50 border-red-500 text-red-600' : 'border-gray-300'}`}>270°</button>
                </div>
              )}

              {activeTool === 'delete-pages' && (
                <div className="mb-8 w-full max-w-sm">
                  <label className="block text-left font-bold text-gray-700 mb-2">Páginas para Excluir</label>
                  <input
                    type="text"
                    value={pagesToDelete}
                    onChange={e => setPagesToDelete(e.target.value)}
                    placeholder="Ex: 1, 2, 5"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-red-500 outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-left">Separe os números por vírgula.</p>
                </div>
              )}

              {activeTool === 'watermark' && (
                <div className="mb-8 w-full max-w-sm">
                  <label className="block text-left font-bold text-gray-700 mb-2">Texto da Marca d'água</label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={e => setWatermarkText(e.target.value)}
                    placeholder="Ex: CONFIDENCIAL"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-red-500 outline-none"
                  />
                </div>
              )}


              <div className="border-4 border-dashed border-red-100 bg-red-50/30 rounded-3xl p-12 hover:bg-red-50 transition-colors cursor-pointer group relative w-full max-w-2xl">
                <input
                  type="file"
                  multiple={activeTool === 'merge' || activeTool === 'images-to-pdf'}
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  accept={
                    activeTool === 'images-to-pdf' || activeTool === 'sign' ? 'image/*,.pdf' :
                      activeTool === 'word-to-pdf' ? '.doc,.docx' :
                        activeTool === 'excel-to-pdf' ? '.xls,.xlsx' :
                          activeTool === 'ppt-to-pdf' ? '.ppt,.pptx' :
                            (
                              activeTool === 'merge' ||
                              activeTool === 'split' ||
                              activeTool === 'rotate' ||
                              activeTool === 'protect' ||
                              activeTool === 'unlock' ||
                              activeTool === 'delete-pages' ||
                              activeTool === 'watermark' ||
                              activeTool === 'page-numbers' ||
                              activeTool === 'compress' ||
                              activeTool === 'repair' ||
                              activeTool === 'start-ocr' ||
                              activeTool === 'pdf-to-word' ||
                              activeTool === 'pdf-to-excel' ||
                              activeTool === 'pdf-to-ppt' ||
                              activeTool === 'pdf-to-jpg'
                            ) ? '.pdf' : '*'
                  }
                />
                <div className="bg-red-600 text-white w-fit px-8 py-4 rounded-xl font-bold text-xl mx-auto shadow-xl shadow-red-600/30 group-hover:scale-105 transition-transform flex items-center gap-3">
                  <UploadCloud size={28} /> Selecionar Arquivos
                </div>
                <p className="text-gray-400 mt-4 font-medium">
                  {selectedFiles.length > 0
                    ? `${selectedFiles.length} arquivo(s) selecionado(s)`
                    : 'ou arraste e solte seus arquivos aqui'}
                </p>
                {selectedFiles.length > 0 && (
                  <div className="mt-4 text-sm text-gray-600 max-h-32 overflow-y-auto">
                    {selectedFiles.map(f => f.name).join(', ')}
                  </div>
                )}
              </div>

              <button
                onClick={handleProcess}
                disabled={selectedFiles.length === 0}
                className="mt-8 text-white bg-green-600 px-12 py-4 rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                Processar PDF
              </button>
            </div>
          )}

          {isProcessing && (
            <div className="text-center animate-fade-in">
              <div className="w-20 h-20 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-2xl font-bold text-gray-900">Processando...</h3>
              <p className="text-gray-500 mt-2">Estamos trabalhando no seu arquivo.</p>
            </div>
          )}

          {isCompleted && downloadUrl && (
            <div className="text-center animate-scale-in">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download size={48} />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Sucesso!</h3>
              <p className="text-gray-500 mb-8">Seu arquivo está pronto para download.</p>

              <a
                href={downloadUrl}
                download={`processed_${activeTool === 'pdf-to-word' ? selectedFiles[0].name.replace('.pdf', '.docx') :
                  activeTool === 'pdf-to-excel' ? selectedFiles[0].name.replace('.pdf', '.xlsx') :
                    activeTool === 'pdf-to-ppt' ? selectedFiles[0].name.replace('.pdf', '.pptx') :
                      activeTool === 'pdf-to-jpg' ? selectedFiles[0].name.replace('.pdf', '.jpg') :
                        activeTool === 'word-to-pdf' ? selectedFiles[0].name.replace(/\.(doc|docx)$/, '.pdf') :
                          activeTool === 'excel-to-pdf' ? selectedFiles[0].name.replace(/\.(xls|xlsx)$/, '.pdf') :
                            activeTool === 'ppt-to-pdf' ? selectedFiles[0].name.replace(/\.(ppt|pptx)$/, '.pdf') :
                              activeTool === 'images-to-pdf' ? 'converted_images.pdf' :
                                activeTool === 'sign' ? selectedFiles[0].name.replace('.pdf', '_signed.pdf') :
                                  `processed_${selectedFiles[0]?.name || 'document.pdf'}`}`}
                className="bg-red-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-red-700 shadow-xl shadow-red-600/20 flex items-center gap-3 mx-auto inline-flex"
              >
                <Download size={24} /> Baixar PDF Agora
              </a>

              <div className="mt-8 flex gap-4 justify-center">
                <button onClick={reset} className="text-gray-500 hover:text-gray-800 font-medium">Fazer outra tarefa</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PDFTools;
