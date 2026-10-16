/* Imágenes e iconos del caso (SVG en línea para que funcionen sin conexión) */
(function () {
  'use strict';
  const LT = (window.LT = window.LT || {});
  const uri = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  const LOGO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="96" fill="#5b3a29"/><circle cx="100" cy="100" r="84" fill="none" stroke="#c9a27e" stroke-width="3"/><path d="M60 88h68v20a32 32 0 0 1-32 32h-4a32 32 0 0 1-32-32z" fill="#faf6f0"/><path d="M128 95h7a13 13 0 0 1 0 26h-9" fill="none" stroke="#faf6f0" stroke-width="7"/><path d="M80 56c0 9 9 9 9 18M100 52c0 9 9 9 9 18" stroke="#c9a27e" stroke-width="5" fill="none" stroke-linecap="round"/><text x="100" y="170" text-anchor="middle" font-family="Georgia,serif" font-size="25" font-weight="bold" fill="#faf6f0">La Taza</text></svg>';
  const CAPUCHINO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180"><rect width="240" height="180" rx="14" fill="#e9dccb"/><ellipse cx="120" cy="140" rx="96" ry="22" fill="#d2bfa6"/><circle cx="120" cy="88" r="62" fill="#fff"/><circle cx="120" cy="88" r="50" fill="#9b6a44"/><path d="M120 58c-16 10-22 26-12 38 6 7 18 8 24 0 10-12 4-28-12-38z" fill="#f4e6d2"/><path d="M120 66v40" stroke="#9b6a44" stroke-width="3"/><path d="M182 88h14a12 12 0 0 1 0 24h-16" fill="none" stroke="#fff" stroke-width="9"/></svg>';
  const CROISSANT = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180"><rect width="240" height="180" rx="14" fill="#f6ead7"/><path d="M40 120c10-50 50-76 80-76s70 26 80 76c-14 6-28 2-34-8-10 10-30 14-46 14s-36-4-46-14c-6 10-20 14-34 8z" fill="#d99a47"/><path d="M84 60c6 20 6 46-2 66M120 50v78M156 60c-6 20-6 46 2 66" stroke="#a8692a" stroke-width="5" fill="none" stroke-linecap="round"/></svg>';
  const SUCURSAL = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180"><rect width="240" height="180" rx="14" fill="#dfe9e3"/><rect x="40" y="62" width="160" height="96" fill="#fff" stroke="#5b3a29" stroke-width="4"/><path d="M30 64l18-30h144l18 30z" fill="#1e7145"/><path d="M48 34v30M84 34v30M120 34v30M156 34v30M192 34v30" stroke="#fff" stroke-width="4"/><rect x="58" y="86" width="56" height="40" fill="#c9e3f5" stroke="#5b3a29" stroke-width="3"/><rect x="134" y="86" width="44" height="72" fill="#8a5a3c"/><circle cx="170" cy="124" r="3" fill="#faf6f0"/><text x="120" y="54" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="#fff">LA TAZA</text></svg>';

  const ic = (d, color) => uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' + (color || '#5b3a29') + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>');
  const ICONOS = [
    ['taza', 'Taza de café', 'M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 11h2a2 2 0 0 1 0 4h-2M8 3c0 2 2 2 2 4M12 3c0 2 2 2 2 4'],
    ['grano', 'Grano de café', 'M12 3c5 0 8 4 8 9s-3 9-8 9-8-4-8-9 3-9 8-9zM12 3c-2 4 2 8 0 9s-2 5 0 9'],
    ['croissant', 'Pan', 'M3 15c2-6 6-9 9-9s7 3 9 9c-2 1-4 0-5-1-1 1-3 2-4 2s-3-1-4-2c-1 1-3 2-5 1zM9 8l1 9M15 8l-1 9'],
    ['reloj', 'Horario', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2'],
    ['ubicacion', 'Ubicación', 'M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12zM12 6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z'],
    ['telefono', 'Teléfono', 'M5 3h4l2 5-3 2a11 11 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z'],
    ['estrella', 'Favorito', 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z'],
    ['corazon', 'Me gusta', 'M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z'],
    ['wifi', 'Wifi', 'M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01'],
    ['tarjeta', 'Pago con tarjeta', 'M3 6h18v12H3zM3 10h18M7 15h4'],
    ['hoja', 'Natural', 'M5 19c0-9 6-14 15-14 0 9-5 15-14 15M5 19l8-8'],
    ['regalo', 'Promoción', 'M3 9h18v4H3zM5 13h14v8H5zM12 9v12M12 9c-2-4-6-4-6-1 0 1 1 1 6 1zM12 9c2-4 6-4 6-1 0 1-1 1-6 1z'],
  ];

  LT.GALERIA = {
    logo: uri(LOGO),
    logoSVG: LOGO,
    imagenes: [
      { id: 'logo', nombre: 'Logo de La Taza', src: uri(LOGO), ancho: 110, alto: 110 },
      { id: 'capuchino', nombre: 'Foto: capuchino', src: uri(CAPUCHINO), ancho: 160, alto: 120 },
      { id: 'croissant', nombre: 'Foto: croissant', src: uri(CROISSANT), ancho: 160, alto: 120 },
      { id: 'sucursal', nombre: 'Foto: sucursal', src: uri(SUCURSAL), ancho: 160, alto: 120 },
    ],
    iconos: ICONOS.map(([id, nombre, d]) => ({ id, nombre, src: ic(d) })),
  };
})();
