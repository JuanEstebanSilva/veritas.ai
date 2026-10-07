export interface Consultorio {
  id: number;
  numero: string;
  piso: string;
}

export const consultorios: Consultorio[] = [
  { id: 1, numero: '101', piso: '1' },
  { id: 2, numero: '202', piso: '2' },
  { id: 3, numero: '303', piso: '3' },
];

export default consultorios;
