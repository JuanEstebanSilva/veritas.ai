export interface Consultorio {
  id: number;
  numero: string;
  piso: string;
}

export const consultorios: Consultorio[] = [
  { id: 1, numero: 'Lab-GPU-01', piso: 'Servidor Lingüístico NLP' },
  { id: 2, numero: 'Lab-Cluster-02', piso: 'Motor de Comparación Vectorial' },
  { id: 3, numero: 'Lab-Neural-03', piso: 'Detector de Generación IA' },
];

export default consultorios;
