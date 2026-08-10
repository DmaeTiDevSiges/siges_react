const fs = require('fs');

const path = 'views/OrderVisit/OrderVisitAsset/OrderVisitAssetReport.tsx';
let content = fs.readFileSync(path, 'utf8');

const lines = content.split('\n');

const startIndex = lines.findIndex(line => line.includes("className={`py-4 rounded-2xl text-white text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg ${localEditMode === 'review' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}"));

if (startIndex === -1) {
    console.error('Could not find start index');
    process.exit(1);
}

const beforeContent = lines.slice(0, startIndex + 1).join('\n');

const correctSuffix = `                                    >
                                        {isUpdatingStatus ? 'Salvando...' : localEditMode === 'review' ? 'Confirmar Revisão' : 'Confirmar Aprovação'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Movement Validation Modal */}
            <Modal
                isOpen={showMovementModal}
                onClose={() => setShowMovementModal(false)}
                title="Atenção"
                message="O destino da movimentação deve ser diferente da origem (Cliente, Unidade, Setor/Posição, Prioridade ou Situação)."
                type="warning"
                confirmLabel="Entendi"
            />

            {/* Remove Confirmation Modal */}
            <Modal
                isOpen={showRemoveModal}
                onClose={() => setShowRemoveModal(false)}
                onConfirm={handleRemoveAsset}
                title="Remover Ativo"
                message="Tem certeza que deseja remover este ativo desta visita técnica? Esta ação não pode ser desfeita."
                type="error"
                confirmLabel="Sim, Remover"
                cancelLabel="Não, Manter"
                loading={isUpdatingStatus}
            />

            {/* Report Confirmation Modal */}
            <Modal
                isOpen={showReportConfirmModal}
                onClose={() => setShowReportConfirmModal(false)}
                onConfirm={async () => {
                    try {
                        setIsUpdatingStatus(true);
                        if (initialCondition) await handleUpdateComments('before', initialCondition);
                        if (finalCondition) await handleUpdateComments('after', finalCondition);
                        await dataService.reportedOrderVisitAsset(assetId, currentUserId);
                        setAsset(prev => prev ? {
                            ...prev,
                            processingId: 2,
                            processingDescription: 'Reported'
                        } : null);
                        toast.success('Relatório reportado com sucesso!');
                        onBack();
                    } catch (error) {
                        toast.error('Erro ao reportar');
                    } finally {
                        setIsUpdatingStatus(false);
                    }
                }}
                title="Confirmar Reporte"
                message="Após reportar, as informações não poderão ser mais atualizadas. Deseja continuar?"
                type="warning"
                confirmLabel="Sim, Reportar"
                loading={isUpdatingStatus}
            />

            {/* Rejection Modal */}
            <Modal
                isOpen={showRejectionModal}
                onClose={() => {
                    setShowRejectionModal(false);
                    setRejectionNotes('');
                }}
                title="Rejeitar Relatório"
                confirmLabel="Confirmar Rejeição"
                cancelLabel="Cancelar"
                onConfirm={async () => {
                    if (!rejectionNotes.trim()) {
                        toast.error('Informe o motivo da rejeição');
                        return;
                    }
                    try {
                        setIsUpdatingStatus(true);
                        await dataService.disapproveOrderVisitAsset(assetId, rejectionNotes, currentUserId);
                        setAsset(prev => prev ? {
                            ...prev,
                            processingId: 4,
                            processingDescription: 'Rejeitado',
                            disapprovedNotes: rejectionNotes
                        } : null);
                        toast.success('Relatório rejeitado');
                        setShowRejectionModal(false);
                        onBack();
                    } catch (error) {
                        toast.error('Erro ao rejeitar relatório');
                    } finally {
                        setIsUpdatingStatus(false);
                    }
                }}
                loading={isUpdatingStatus}
            >
                <div className="space-y-4 py-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Descreva o motivo pelo qual o relatório do ativo está sendo rejeitado. O técnico receberá esta observação.
                    </p>
                    <textarea
                        value={rejectionNotes}
                        onChange={(e) => setRejectionNotes(e.target.value)}
                        placeholder="Ex: Foto do 'Depois' está embaçada..."
                        className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-red-500 min-h-[120px]"
                    />
                </div>
            </Modal>

            {/* Asset Swap Modal */}
            <Modal
                isOpen={isSwappingModalOpen}
                onClose={() => {
                    setIsSwappingModalOpen(false);
                    setSwapSearchCode('');
                    setSwapSearchResults([]);
                }}
                title="Trocar Ativo (Ativo Errado)"
                confirmLabel={isSearchingSwap ? "Pesquisando..." : "Pesquisar"}
                onConfirm={handleSearchNewAsset}
            >
                <div className="space-y-6">
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl">
                        <p className="text-xs text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                            Utilize esta função apenas se o ativo informado originalmente estiver incorreto. Os dados do novo ativo serão importados para este registro.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                            Código / Tag do Ativo Correto
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={swapSearchCode}
                                onChange={(e) => setSwapSearchCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchNewAsset()}
                                placeholder="Digite o código..."
                                className="flex-1 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold"
                            />
                        </div>
                    </div>

                    {isSearchingSwap && (
                        <div className="flex justify-center py-4">
                            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        </div>
                    )}

                    {!isSearchingSwap && swapSearchResults.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                                Resultados Encontrados
                            </h4>
                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {swapSearchResults.map(res => (
                                    <div
                                        key={res.id}
                                        className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col gap-2"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-[10px] font-black text-indigo-500 uppercase mb-0.5">{res.tagId}</div>
                                                <div className="text-sm font-black text-slate-700 dark:text-slate-200">{res.description}</div>
                                                <div className="text-[11px] font-medium text-slate-500 mt-1">
                                                    Unidade: <span className="text-slate-700 dark:text-slate-300 font-bold">{res.unitDescriptionFull || res.unitDescription}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleSwapAsset(res)}
                                                disabled={isSwapping}
                                                className="px-4 py-2 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                {isSwapping ? 'Processando...' : 'Selecionar'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Photo Action Overlay */}
            {photoActionSection && (
                <div
                    className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={() => setPhotoActionSection(null)}
                >
                    <div
                        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Adicionar Foto</h3>
                                <button
                                    onClick={() => setPhotoActionSection(null)}
                                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
                                >
                                    <span className="material-symbols-outlined text-base">close</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        takeCameraPhoto(photoActionSection);
                                        setPhotoActionSection(null);
                                    }}
                                    className="flex flex-col items-center gap-3 p-6 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl group active:scale-95 transition-all text-indigo-600 dark:text-indigo-400"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-2xl">photo_camera</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Câmera</span>
                                </button>

                                <button
                                    onClick={() => {
                                        handleAddPhotos(photoActionSection);
                                        setPhotoActionSection(null);
                                    }}
                                    className="flex flex-col items-center gap-3 p-6 bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl group active:scale-95 transition-all text-emerald-600 dark:text-emerald-400"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-2xl">photo_library</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Galeria</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Uploading Overlay */}
            {uploadingCount > 0 && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-100 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                    <div className="relative mb-8">
                        <div className="w-24 h-24 border-4 border-indigo-500/20 rounded-full" />
                        <div className="absolute inset-0 w-24 h-24 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl text-indigo-500 animate-pulse">cloud_upload</span>
                        </div>
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] mb-2">Enviando</h3>
                    <p className="text-sm font-bold text-slate-400 italic">
                        {uploadingCount} {uploadingCount === 1 ? 'foto sendo processada' : 'fotos sendo processadas'}...
                    </p>
                </div>
            )}

            {/* Fullscreen Photo Viewer */}
            {expandedImage && (
                <PhotoViewer
                    url={expandedImage}
                    onClose={() => setExpandedImage(null)}
                />
            )}
        </div>
    );
};

export default OrderVisitAssetReport;
`;

fs.writeFileSync(path, beforeContent + '\n' + correctSuffix);
console.log('Fixed OrderVisitAssetReport.tsx');
