import React from 'react';
import { Avatar } from '../ui/Avatar';
import { OrderVisitAssetView } from '../../types';

interface AssetMovementListItemProps {
  asset: OrderVisitAssetView;
  onClick?: () => void;
  className?: string;
}

const formatDate = (value?: string) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const buildSectorPosition = (label?: string, subLabel?: string) => {
  const items = [label, subLabel].filter(Boolean);
  return items.length ? items.join(' > ') : 'Sem setor';
};

export const AssetMovementListItem: React.FC<AssetMovementListItemProps> = ({ asset, onClick, className }) => {
  const badgeLabel = asset.afterStatusDescription || asset.beforeStatusDescription || 'USO';
  const originStatus = asset.beforeStatusDescription || '---';
  const destinationStatus = asset.afterStatusDescription || '---';

  const originClient = asset.beforeClientName || 'Cliente não informado';
  const originUnit = asset.beforeUnitDescription || 'N/I';
  const originLocation = asset.beforeLocation || asset.location || 'N/I';
  const originSector = buildSectorPosition(asset.beforeTagDescription, asset.beforeTagSubDescription);

  const destinationClient = asset.afterClientName || 'Cliente não informado';
  const destinationUnit = asset.afterUnitDescription || 'N/I';
  const destinationLocation = asset.afterLocation || 'N/I';
  const destinationSector = buildSectorPosition(asset.afterTagDescription, asset.afterTagSubDescription || asset.afterUnitAssetTagDescription);

  const imageUrl = asset.afterImgUrl || asset.imgUrl;
  const badgeColor = asset.afterStatusColor || asset.beforeStatusColor || '#22c55e';

  const afterStatusDate = formatDate(asset.afterStatusAt);
  const beforeStatusDate = formatDate(asset.beforeStatusAt);
  const badgeDate = formatDate(asset.afterStatusAt || asset.beforeStatusAt);

  return (
    <div
      onClick={onClick}
      className={`group relative w-full rounded-xl border border-slate-800 bg-slate-950 shadow-xl cursor-pointer ${className || ''}`}
    >
      <div className="p-4">

        {/* Header: info + thumbnail */}
        <div className="flex items-start justify-between gap-3 mb-4">
          
          {/* Left side: Code and Description */}
          <div className="flex flex-col items-start gap-2 flex-1">
            <div
              className="rounded-lg px-4 py-1.5 inline-flex items-center justify-center"
              style={{ backgroundColor: badgeColor }}
            >
              <span className="text-[15px] font-black text-white leading-none tracking-wide">
                {asset.code || 'SEM CÓDIGO'}
              </span>
            </div>
            <h3 className="text-sm font-black uppercase leading-snug text-white">
              {asset.description || 'Descrição não informada'}
            </h3>
          </div>

          {/* Right side: Image */}
          <div className="shrink-0">
            {imageUrl ? (
              <Avatar
                src={imageUrl}
                alt={asset.description || 'Ativo'}
                size="md"
                className="rounded-xl border border-slate-700"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 border border-slate-700 text-slate-500">
                <span className="material-symbols-outlined text-[22px]">inventory_2</span>
              </div>
            )}
          </div>
        </div>

        {/* ORIGEM section */}
        <div className="mb-3">

          {/* UNIDADE ORIGEM */}
          <div className="mb-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">UNIDADE ORIGEM</p>
            <p className="text-xs font-black uppercase text-white mt-0.5">{originClient}</p>
            <p className="text-xs font-black uppercase text-white mt-0.5">{originUnit}</p>
          </div>

          {/* SETOR > POSIÇÃO + LOCALIZAÇÃO */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">SETOR &gt; POSIÇÃO</p>
              <p className="text-xs font-black uppercase text-white mt-0.5">{originSector}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">LOCALIZAÇÃO</p>
              <p className="text-xs font-black uppercase text-white mt-0.5">{originLocation}</p>
            </div>
          </div>

          {/* SITUAÇÃO + DATA */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">SITUAÇÃO</p>
              <p className="text-xs font-black uppercase text-white mt-0.5">{originStatus}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">DATA</p>
              <p className="text-xs font-black uppercase text-white mt-0.5">{beforeStatusDate || '---'}</p>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 my-3" />

        {/* DESTINO section */}
        <div>

          {/* UNIDADE DESTINO */}
          <div className="mb-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">UNIDADE DESTINO</p>
            <p className="text-xs font-black uppercase text-white mt-0.5">{destinationClient}</p>
            <p className="text-xs font-black uppercase text-white mt-0.5">{destinationUnit}</p>
          </div>

          {/* SETOR > POSIÇÃO + LOCALIZAÇÃO */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">SETOR &gt; POSIÇÃO</p>
              <p className="text-xs font-black uppercase text-white mt-0.5">{destinationSector}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">LOCALIZAÇÃO</p>
              <p className="text-xs font-black uppercase text-white mt-0.5">{destinationLocation}</p>
            </div>
          </div>

          {/* SITUAÇÃO + DATA */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">SITUAÇÃO</p>
              <p className="text-xs font-black uppercase text-white mt-0.5">{destinationStatus}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">DATA</p>
              <p className="text-xs font-black uppercase text-white mt-0.5">{afterStatusDate || '---'}</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
