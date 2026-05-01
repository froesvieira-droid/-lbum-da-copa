'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, CheckCircle2, Search, RotateCcw, LayoutGrid, Info, Menu, X, Star, User, Image as ImageIcon, Download, Upload, Eye, EyeOff } from 'lucide-react';
import { TEAMS, type Team } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export default function AlbumPage() {
  const isMobile = useIsMobile();
  const [owned, setOwned] = useState<Record<string, boolean>>({});
  const [selectedTeamId, setSelectedTeamId] = useState<string>(TEAMS[0].id);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const [selectedSticker, setSelectedSticker] = useState<{ team: Team, num: number } | null>(null);

  // Load state from localStorage
  useEffect(() => {
    const loadData = () => {
      const saved = localStorage.getItem('world_cup_album_v1');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setOwned(parsed);
        } catch (e) {
          console.error('Failed to parse saved stickers', e);
        }
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('world_cup_album_v1', JSON.stringify(owned));
    }
  }, [owned, isLoaded]);

  const toggleSticker = (teamCode: string, num: number) => {
    const key = `${teamCode}-${num}`;
    setOwned(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const resetAll = () => {
    if (confirm('Tem certeza que deseja resetar todo o seu álbum?')) {
      setOwned({});
    }
  };

  const exportMissingToCSV = () => {
    const missing: string[][] = [['Time', 'Codigo', 'Tipo', 'Raridade']];
    
    TEAMS.forEach(team => {
      for (let i = 1; i <= 20; i++) {
        if (!owned[`${team.shortName}-${i}`]) {
          const code = `${team.shortName} ${i.toString().padStart(2, '0')}`;
          const isRare = i === 1 || i === 20;
          const type = team.shortName === 'FWC' 
            ? (i === 1 ? 'Troféu' : i === 20 ? 'Mascote' : 'Especial')
            : (i === 1 ? 'Escudo' : i === 20 ? 'Time' : 'Jogador');
          
          missing.push([team.name, code, type, isRare ? 'Rara' : 'Comum']);
        }
      }
    });

    const csvContent = "\uFEFF" + missing.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `figurinhas_faltantes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const newOwned = { ...owned };

      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Match specific codes like "BRA 01" or CSV columns
        // We look for the "Codigo" column which is usually the second one
        const parts = line.split(',');
        const code = parts.length > 1 ? parts[1].trim() : line;
        
        // Expected format "XXX 00"
        const match = code.match(/([A-Z]{3})\s+(\d{2})/);
        if (match) {
          const shortName = match[1];
          const num = parseInt(match[2], 10);
          newOwned[`${shortName}-${num}`] = true;
        }
      }

      setOwned(newOwned);
      alert('Importação concluída com sucesso!');
    };
    reader.readAsText(file);
  };

  const totalOwnedCount = Object.values(owned).filter(val => val).length;
  const totalStickersCount = TEAMS.length * 20;
  const completionPercentage = Math.round((totalOwnedCount / totalStickersCount) * 100);

  const filteredTeams = TEAMS.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    team.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTeamProgress = (teamCode: string) => {
    let count = 0;
    for (let i = 1; i <= 20; i++) {
      if (owned[`${teamCode}-${i}`]) count++;
    }
    return count;
  };

  const selectedTeam = TEAMS.find(t => t.id === selectedTeamId) || TEAMS[0];
  const selectedTeamProgress = getTeamProgress(selectedTeam.shortName);

  const isRareSticker = (num: number) => num === 1 || num === 20;

  const getStickerType = (teamShortName: string, num: number) => {
    if (teamShortName === 'FWC') {
      if (num === 1) return 'Troféu';
      if (num === 20) return 'Mascote';
      return 'Especial';
    }
    if (num === 1) return 'Escudo';
    if (num === 20) return 'Time';
    return 'Jogador';
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans relative">
      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col border-r border-slate-800 transition-transform duration-300 transform lg:translate-x-0 lg:static shrink-0",
        isMobile && !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="text-indigo-500 w-5 h-5" />
            <h1 className="text-lg font-bold tracking-tight uppercase">Album Pro 2026</h1>
          </div>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="p-4 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search teams..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 scrollbar-none">
          <div className="px-6 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Selections</div>
          <div className="space-y-0.5">
            {filteredTeams.map((team) => {
              const isActive = selectedTeamId === team.id;
              const progress = getTeamProgress(team.shortName);
              
              return (
                <button
                  key={team.id}
                  onClick={() => {
                    setSelectedTeamId(team.id);
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center px-6 py-3 transition-colors text-left group",
                    isActive 
                      ? "bg-indigo-600/20 border-l-4 border-indigo-500 text-white" 
                      : "hover:bg-slate-800/50 text-slate-400 border-l-4 border-transparent hover:text-slate-200"
                  )}
                >
                  <span className="w-6 h-4 rounded-sm mr-3 flex items-center justify-center text-[8px] font-bold bg-slate-800 group-hover:bg-slate-700">
                    {team.flag}
                  </span>
                  <span className="text-sm font-medium truncate">{team.shortName}</span>
                  <span className={cn(
                    "ml-auto text-[10px] font-mono",
                    isActive ? "text-indigo-400" : "text-slate-600"
                  )}>
                    {progress.toString().padStart(2, '0')}/20
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 bg-slate-950 border-t border-slate-800">
          <div className="flex justify-between items-end mb-2">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tight text-white/50">Global Progress</div>
            <div className="text-xs font-mono text-indigo-400">{completionPercentage}%</div>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              className="h-full bg-indigo-500"
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-mono text-slate-500">
            <span>{totalOwnedCount} COLLECTED</span>
            <span>{totalStickersCount} TOTAL</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header / Navbar */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 shrink-0 justify-between">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-600"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selectedTeam.flag}</span>
            <div className="flex flex-col">
              <span className="font-bold uppercase tracking-tight leading-none">{selectedTeam.shortName}</span>
              <span className="text-[8px] text-slate-500 font-semibold truncate max-w-[100px]">{selectedTeam.name}</span>
            </div>
          </div>
          
          <div className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full text-[10px] font-mono font-bold text-indigo-600">
             {completionPercentage}%
          </div>
          
          <button 
            onClick={() => setIsFooterVisible(!isFooterVisible)}
            className="p-2 ml-1 text-slate-400 hover:text-indigo-600 transition-colors"
            title={isFooterVisible ? "Ocultar Painel Inferior" : "Mostrar Painel Inferior"}
          >
            {isFooterVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </header>

        {/* Desktop Team Header */}
        <header className="hidden lg:flex h-32 bg-white border-b border-slate-200 items-center px-10 shrink-0">
          <div className="text-5xl mr-6 filter drop-shadow-sm select-none">
            {selectedTeam.flag}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase truncate leading-none">
                  {selectedTeam.shortName}
                </h2>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                  {selectedTeam.name}
                </span>
              </div>
            </div>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-2 truncate">
              <Info className="w-3.5 h-3.5" />
              FIFA World Cup 2026 • Group Section • Collection Status
            </p>
          </div>
          <div className="ml-auto flex gap-6 pl-6 shrink-0">
            <div className="text-right">
              <div className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Progress</div>
              <div className="text-2xl font-mono font-bold text-indigo-600">
                {selectedTeamProgress.toString().padStart(2, '0')}/20
              </div>
            </div>
            <div className="h-10 w-px bg-slate-200 self-center"></div>
            <button 
              onClick={() => setIsFooterVisible(!isFooterVisible)}
              className="flex flex-col items-center justify-center px-3 hover:bg-slate-50 rounded-md transition-colors text-slate-400 hover:text-indigo-600"
              title={isFooterVisible ? "Ocultar Painel Inferior" : "Mostrar Painel Inferior"}
            >
              <div className="text-[10px] uppercase font-bold tracking-widest mb-1">Painel</div>
              {isFooterVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Sticker Grid */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50/50">
          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 lg:gap-2.5">
            {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => {
              const isOwned = owned[`${selectedTeam.shortName}-${num}`];
              const stickerCode = `${selectedTeam.shortName} ${num.toString().padStart(2, '0')}`;
              const isRare = isRareSticker(num);
              
              return (
                <motion.button
                  key={`${selectedTeam.id}-${num}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ 
                    opacity: 1, 
                    scale: isOwned ? (isRare ? 1.01 : 1) : 1, 
                    y: 0,
                    rotate: isOwned ? (isRare ? 0.5 : -0.3) : 0
                  }}
                  transition={{ 
                    duration: 0.3, 
                    delay: num * 0.02,
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                  }}
                  whileHover={{ scale: 1.05, zIndex: 10 }}
                  whileTap={{ scale: 0.95 }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    toggleSticker(selectedTeam.shortName, num);
                  }}
                  title="Clique duplo para marcar/desmarcar"
                  className={cn(
                    "aspect-[3/4] rounded-sm shadow-sm relative group flex flex-col transition-all duration-500 text-left cursor-pointer overflow-hidden",
                    isOwned 
                      ? isRare 
                        ? "bg-gradient-to-br from-amber-100 to-white border border-amber-400 shadow-md z-10" 
                        : "bg-white border border-slate-300 shadow-sm z-10" 
                      : isRare 
                        ? "bg-slate-50 border border-amber-200/50 opacity-40 grayscale-[0.8] border-dashed hover:opacity-100 hover:grayscale-0 hover:border-amber-400"
                        : "bg-slate-50 border border-slate-200 opacity-30 grayscale-[1] border-dashed hover:opacity-100 hover:grayscale-0 hover:border-indigo-300"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isOwned && (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className={cn(
                          "absolute top-0.5 right-0.5 lg:top-1 lg:right-1 w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 rounded-full flex items-center justify-center text-white shadow-inner z-40",
                          isRare ? "bg-amber-600" : "bg-blue-600"
                        )}
                      >
                        {isRare ? <Star className="w-1.5 h-1.5 fill-current" /> : <div className="w-1 h-1 bg-white rounded-full" />}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex-1 flex flex-col items-center justify-center p-0.5 lg:p-1 relative w-full overflow-hidden">
                    {/* Sticker Image logic removed for optimization */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-0.5">
                      <div className="flex flex-col items-center justify-center opacity-10">
                        <span className="font-mono text-[10px] font-bold">{stickerCode}</span>
                      </div>
                    </div>

                    {/* Sticker Label Overlay */}
                    <div className="relative z-30 mt-auto w-full px-1 py-0.5">
                      <div className={cn(
                          "text-[8px] lg:text-[10px] font-black font-mono transition-colors tracking-tighter leading-none flex items-center justify-between",
                          isOwned ? "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" : "text-slate-300"
                      )}>
                        <span>{stickerCode}</span>
                        {isOwned && isRare && <Star className="w-2 h-2 text-amber-400 fill-amber-400" />}
                      </div>
                      <div className={cn(
                          "text-[5px] lg:text-[6px] uppercase font-bold tracking-widest mt-0.5 leading-none transition-opacity",
                          isOwned 
                            ? "text-white/90 drop-shadow-[0_1px_0.5px_rgba(0,0,0,0.5)]" 
                            : "text-slate-400 opacity-50"
                      )}>
                        {selectedTeam.shortName === 'FWC' 
                          ? (num === 1 ? 'Troféu' : num === 20 ? 'Mascote' : 'Especial')
                          : (num === 1 ? 'Escudo' : num === 20 ? 'Time' : 'Jogador')
                        }
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    "h-0.5 lg:h-1 w-full transition-colors relative z-20",
                    isOwned 
                      ? isRare ? "bg-amber-500 shadow-[0_-1px_2px_rgba(245,158,11,0.5)]" : "bg-blue-600 shadow-[0_-1px_2px_rgba(37,99,235,0.3)]" 
                      : "bg-slate-200/50"
                  )}></div>

                  {/* Shimmer effect for rare stickers */}
                  {isRare && isOwned && (
                    <motion.div
                      animate={{
                        x: ['-250%', '250%'],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent w-full skew-x-25 pointer-events-none z-30 opacity-70"
                    />
                  )}

                  {/* Hover effect for missing stickers - hidden on mobile for better UX */}
                  {!isOwned && !isMobile && (
                    <div className={cn(
                        "absolute inset-0 transition-colors rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 z-30",
                        isRare ? "bg-amber-500/10" : "bg-indigo-600/5"
                    )}>
                      <span className={cn(
                        "text-white text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider shadow-sm",
                        isRare ? "bg-amber-500" : "bg-indigo-600"
                      )}>Collect</span>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </main>

        {/* Footer Area */}
        <AnimatePresence>
          {isFooterVisible && (
            <motion.footer 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white border-t border-slate-200 flex flex-col lg:flex-row items-center px-4 lg:px-10 text-[10px] uppercase tracking-widest text-slate-500 font-bold shrink-0 gap-4 lg:gap-0 overflow-hidden py-4 lg:py-0 lg:h-14"
            >
              <div className="flex gap-6 w-full lg:w-auto justify-center lg:justify-start">
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full mr-2"></div> 
              Collected
            </div>
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 bg-white border border-slate-300 rounded-full mr-2"></div> 
              Missing
            </div>
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 bg-amber-500 rounded-full mr-2"></div> 
              Rare Item
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row lg:ml-auto gap-3 w-full lg:w-auto">
            <input 
              type="file" 
              id="csv-import" 
              accept=".csv" 
              className="hidden" 
              onChange={handleImportCSV} 
            />
            <button 
              onClick={() => document.getElementById('csv-import')?.click()}
              className="px-4 py-2 lg:py-1.5 bg-indigo-600 border border-indigo-500 rounded text-white hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Upload className="w-3 h-3" />
              Importar CSV
            </button>
            <button 
              onClick={exportMissingToCSV}
              className="px-4 py-2 lg:py-1.5 bg-emerald-600 border border-emerald-500 rounded text-white hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-3 h-3" />
              Exportar Faltantes
            </button>
            <button 
              onClick={resetAll}
              className="px-4 py-2 lg:py-1.5 bg-white border border-slate-200 rounded text-slate-400 hover:text-red-500 hover:border-red-200 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3 h-3" />
              Reset System
            </button>
            <div className="hidden lg:block h-6 w-px bg-slate-200 mx-1"></div>
            <div className="px-4 py-2 lg:py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-400 select-none text-center">
              v2.0.5 - Mobile Optimized
            </div>
          </div>
        </motion.footer>
        )}
      </AnimatePresence>

      {/* Sticker Detail Modal */}
      <AnimatePresence>
        {selectedSticker && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSticker(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedSticker.team.flag}</span>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-slate-900 leading-none">{selectedSticker.team.shortName}</h3>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{selectedSticker.team.name}</span>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">
                      FIGURINHA #{selectedSticker.num.toString().padStart(2, '0')}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedSticker(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sticker Preview (Image removed) */}
              <div className="p-8 flex flex-col items-center justify-center bg-gradient-to-b from-white to-slate-50">
                <motion.div 
                  layoutId={`sticker-${selectedSticker.team.shortName}-${selectedSticker.num}`}
                  className={cn(
                    "w-48 h-64 rounded-sm shadow-xl relative overflow-hidden border-[6px] border-white ring-1 ring-slate-200 bg-slate-100 flex items-center justify-center",
                    isRareSticker(selectedSticker.num) ? "rotate-[2deg]" : "rotate-[-1deg]"
                  )}
                >
                  <div className="text-4xl font-black text-slate-800 opacity-20 select-none">
                    {selectedSticker.team.shortName}
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  
                  {isRareSticker(selectedSticker.num) && owned[`${selectedSticker.team.shortName}-${selectedSticker.num}`] && (
                    <motion.div
                      animate={{ x: ['-200%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full skew-x-12 z-10"
                    />
                  )}

                  <div className="absolute bottom-3 left-3 text-slate-900">
                    <div className="text-xl font-black font-mono leading-none">
                      {selectedSticker.team.shortName} {selectedSticker.num.toString().padStart(2, '0')}
                    </div>
                    <div className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-60">
                      {getStickerType(selectedSticker.team.shortName, selectedSticker.num)}
                    </div>
                  </div>

                  {isRareSticker(selectedSticker.num) && (
                    <div className="absolute top-2 right-2 p-1 bg-amber-500 rounded-full shadow-lg">
                      <Star className="w-3 h-3 text-white fill-current" />
                    </div>
                  )}
                </motion.div>

                <div className="mt-8 text-center">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                    isRareSticker(selectedSticker.num) 
                      ? "bg-amber-50 text-amber-600 border-amber-200" 
                      : "bg-blue-50 text-blue-600 border-blue-200"
                  )}>
                    {isRareSticker(selectedSticker.num) ? "Figurinha Rara (Ouro)" : "Figurinha Regular"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 bg-white border-t border-slate-100">
                <button
                  onClick={() => {
                    toggleSticker(selectedSticker.team.shortName, selectedSticker.num);
                  }}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 active:scale-[0.98]",
                    owned[`${selectedSticker.team.shortName}-${selectedSticker.num}`]
                      ? "bg-slate-100 text-red-500 hover:bg-red-50 border border-slate-200 hover:border-red-100"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                  )}
                >
                  {owned[`${selectedSticker.team.shortName}-${selectedSticker.num}`] ? (
                    <>
                      <X className="w-5 h-5" />
                      Remover da Coleção
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Marcar como Adquirida
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </div>
);
}

