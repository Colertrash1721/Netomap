import { useState } from 'react';
import axios from 'axios';
import { postReport } from '@/services/reports/postReport';

type fileType = {
    driver: File[];
    opening: File[];
};

type fileKey = keyof fileType;

type ReportForm = {
    device: string;
    salida: string;
    conductor: string;
    llegada: string;
    unidad: string;
    apertura: string;
    responsable: string;
    reporte: string;
    detalles: string;
    recepcionista: string;
};

export default function useReport() {
    const [files, setFiles] = useState<fileType>({
        driver: [],
        opening: [],
    });

    const [formData, setFormData] = useState<ReportForm>({
        device: '',
        salida: '',
        conductor: '',
        llegada: '',
        unidad: '',
        apertura: '',
        responsable: '',
        reporte: '',
        detalles: '',
        recepcionista: '',
    });

    const processFiles = (name: fileKey, newFiles: File[], multi: boolean) => {
        const validFiles = newFiles.filter(file => file.type.startsWith('image/'));
        
        if (validFiles.length === 0) {
            console.warn('No se encontraron archivos de imagen válidos');
            return;
        }

        setFiles(prev => ({
            ...prev,
            [name]: multi ? [...prev[name], ...validFiles] : [validFiles[0]],
        }));
    };

    const handleDrop = (
        e: React.DragEvent<HTMLInputElement>,
        name: fileKey,
        multi: boolean
    ) => {
        e.preventDefault();
        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            console.log('Archivos arrastrados:', droppedFiles);
            processFiles(name, Array.from(droppedFiles), multi);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (e.target instanceof HTMLInputElement && e.target.type === 'file') {
            const inputFiles = e.target.files;
            if (!inputFiles || inputFiles.length === 0) return;
            
            const fileKey = name as fileKey;
            const isMulti = fileKey === 'opening';
            console.log('Archivos seleccionados:', inputFiles);
            processFiles(fileKey, Array.from(inputFiles), isMulti);
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const removeFile = (name: fileKey, index: number) => {
        setFiles(prev => ({
            ...prev,
            [name]: prev[name].filter((_, i) => i !== index),
        }));
    };

    const resetForm = () => {
        setFormData({
            device: '',
            salida: '',
            conductor: '',
            llegada: '',
            unidad: '',
            apertura: '',
            responsable: '',
            reporte: '',
            detalles: '',
            recepcionista: '',
        });
        setFiles({
            driver: [],
            opening: [],
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(e.target);
    
    try {
        const form = new FormData();

        // Agregar campos de texto
        Object.entries(formData).forEach(([key, value]) => {
            if (value) form.append(key, value);
        });

        // Agregar archivos con los nombres que espera el backend
        if (files.driver.length > 0) {
            form.append('colocacion', files.driver[0]);
            console.log('Archivo driver/colocacion agregado:', files.driver[0].name);
        }

        files.opening.forEach((file) => {
            form.append('apertura', file);
            console.log('Archivo opening/apertura agregado:', file.name);
        });

        // Verificar contenido antes de enviar
        console.log('Contenido de FormData antes de enviar:');
        Array.from(form.entries()).forEach(([key, value]) => {
            console.log(key, value instanceof File ? value.name : value);
        });

        const pdfBlob = await postReport(form);

        // Crear y descargar PDF
        const url = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        resetForm();

    } catch (error) {
        console.error('Error al enviar formulario:', error);
        alert('Error al generar el reporte');
    }
};

    return {
        files,
        formData,
        handleDrop,
        removeFile,
        handleChange,
        handleSubmit,
        setFormDataFiles: processFiles,
    };
}