import React from 'react';
import { PlagelioLogo, PlagelioLogoProps } from './PlagelioLogo';

export type VeritasLogoProps = PlagelioLogoProps;

/**
 * @deprecated Utilizar `PlagelioLogo` en su lugar.
 * Mantenido por retrocompatibilidad.
 */
export const VeritasLogo: React.FC<VeritasLogoProps> = (props) => {
  return <PlagelioLogo {...props} />;
};

export { PlagelioLogo };
