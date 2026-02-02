import useReport from "@/hooks/reports/useReport";
import { useEffect } from "react";

type props = {
  background?: string;
  name: "driver" | "opening";
  multi: boolean;
};

export default function ImageInput({ background, multi, name }: props) {
  const { files, handleDrop, removeFile, setFormDataFiles } = useReport();

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = e.target.files;
    if (!inputFiles || inputFiles.length === 0) return;

    const newFiles = Array.from(inputFiles);
    console.log(`Archivos seleccionados para ${name}:`, newFiles);

    // Actualiza el estado visual
    handleDrop(
      {
        preventDefault: () => {},
        dataTransfer: {
          files: inputFiles,
        },
      } as unknown as React.DragEvent<HTMLInputElement>,
      name,
      multi
    );

    // Actualiza el estado real que se enviará
    setFormDataFiles(name, newFiles, multi);
  };

  useEffect(() => {
    console.log(`Archivos actualizados en ${name}:`, files[name]);
  }, [files, name]);

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {files[name].map((file, index) => (
          <div
            key={`${name}-${index}`}
            className="relative w-32 h-32 shadow-md rounded overflow-hidden border border-gray-300"
          >
            <img
              src={URL.createObjectURL(file)}
              alt={`Preview ${name} ${index}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => removeFile(name, index)}
              className="absolute top-1 right-1 text-black rounded-full w-6 h-6 flex items-center justify-center text-md"
              title="Eliminar"
            >
              <i className="bx bx-x-circle"></i>
            </button>
          </div>
        ))}
      </div>

      <div
        className={`h-40 flex justify-center flex-col items-center bg-${background || "gray-100"
          } text-xl text-gray-500 relative`}
      >
        <i
          className={`bx bx-${multi ? "images" : "image-add"} text-5xl text-gray-500`}
        ></i>
        <p>Selecciona o arrastra imagen</p>
        <input
          type="file"
          name={name}
          accept="image/*"
          multiple={multi}
          onChange={handleFileInput}
          className="absolute w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </>
  );
}