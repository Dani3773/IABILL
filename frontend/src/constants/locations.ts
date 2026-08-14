export interface CountryOption {
  code: string
  name: string
}

// Brasil + os 27 países da União Europeia — os dois regimes legais suportados (LGPD/RGPD)
export const COUNTRIES: CountryOption[] = [
  { code: 'BR', name: 'Brasil' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'AT', name: 'Áustria' },
  { code: 'BE', name: 'Bélgica' },
  { code: 'BG', name: 'Bulgária' },
  { code: 'CY', name: 'Chipre' },
  { code: 'HR', name: 'Croácia' },
  { code: 'DK', name: 'Dinamarca' },
  { code: 'SK', name: 'Eslováquia' },
  { code: 'SI', name: 'Eslovênia' },
  { code: 'ES', name: 'Espanha' },
  { code: 'EE', name: 'Estônia' },
  { code: 'FI', name: 'Finlândia' },
  { code: 'FR', name: 'França' },
  { code: 'GR', name: 'Grécia' },
  { code: 'HU', name: 'Hungria' },
  { code: 'IE', name: 'Irlanda' },
  { code: 'IT', name: 'Itália' },
  { code: 'LV', name: 'Letônia' },
  { code: 'LT', name: 'Lituânia' },
  { code: 'LU', name: 'Luxemburgo' },
  { code: 'MT', name: 'Malta' },
  { code: 'NL', name: 'Países Baixos' },
  { code: 'PL', name: 'Polônia' },
  { code: 'PT', name: 'Portugal' },
  { code: 'CZ', name: 'República Tcheca' },
  { code: 'RO', name: 'Romênia' },
  { code: 'SE', name: 'Suécia' },
]

export const BRAZILIAN_STATES: string[] = [
  'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará',
  'Distrito Federal', 'Espírito Santo', 'Goiás', 'Maranhão',
  'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Pará',
  'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro',
  'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia', 'Roraima',
  'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins',
]