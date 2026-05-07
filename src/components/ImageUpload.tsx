import React, { ChangeEvent, useRef } from 'react';
import { Camera, Trash2 } from 'lucide-react';

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div 
        className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-2 border-dashed border-white/30 relative group cursor-pointer hover:border-indigo-400 transition-all"
        onClick={() => fileInputRef.current?.click()}
      >
        {value ? (
          <>
            <img src={value} alt="Profile" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <Camera className="w-8 h-8 text-white/40 group-hover:text-indigo-400 transition-colors" />
            <span className="text-[10px] font-bold mt-1 text-white/40 group-hover:text-indigo-400 transition-colors">FOTO</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-xs px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-white font-medium transition-all cursor-pointer"
        >
          Enviar Foto
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs px-4 py-2 flex items-center gap-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium border border-transparent cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Remover
          </button>
        )}
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        onClick={(e) => { (e.currentTarget as HTMLInputElement).value = ''; }}
        accept="image/png, image/jpeg, image/jpg" 
        className="hidden" 
      />
    </div>
  );
}
