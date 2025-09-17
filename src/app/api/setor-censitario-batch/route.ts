import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

interface BatchSetorCensitarioRequest {
  tipo: 'endereco' | 'coordenadas'
  itens: Array<{
    endereco?: string
    latitude?: number
    longitude?: number
    id?: string // Identificador opcional para rastreamento
  }>
}

interface BatchSetorCensitarioResponse {
  resultados: Array<{
    id?: string
    codigoSetorCensitario: string
    municipio: string
    bairro?: string
    enderecoPesquisado: string
    erro?: string
  }>
}

interface SetorCensitarioResponse {
  codigoSetorCensitario: string
  municipio: string
  bairro?: string
  enderecoPesquisado: string
}

// Lista completa dos 92 municípios do Estado do Rio de Janeiro com coordenadas aproximadas do centro
const municipiosRJ: Record<string, { lat: number; lng: number; codigoIBGE: string }> = {
  'angra dos reis': { lat: -23.0067, lng: -44.3181, codigoIBGE: '3300100' },
  'aperibé': { lat: -21.5886, lng: -42.0519, codigoIBGE: '3300159' },
  'araruama': { lat: -22.8739, lng: -42.3514, codigoIBGE: '3300209' },
  'areal': { lat: -22.2453, lng: -43.0956, codigoIBGE: '3300225' },
  'armacao dos buzios': { lat: -22.7464, lng: -41.8817, codigoIBGE: '3300233' },
  'arraial do cabo': { lat: -22.9661, lng: -42.0264, codigoIBGE: '3300258' },
  'barra do pirai': { lat: -22.4678, lng: -43.8278, codigoIBGE: '3300274' },
  'barra mansa': { lat: -22.5486, lng: -44.1728, codigoIBGE: '3300308' },
  'belford roxo': { lat: -22.7642, lng: -43.3994, codigoIBGE: '3300357' },
  'bom jardim': { lat: -22.1672, lng: -42.4158, codigoIBGE: '3300373' },
  'bom jesus do itabapoana': { lat: -21.1364, lng: -41.6828, codigoIBGE: '3300403' },
  'cabo frio': { lat: -22.8781, lng: -42.0197, codigoIBGE: '3300452' },
  'cachoeiras de macacu': { lat: -22.4608, lng: -42.6528, codigoIBGE: '3300478' },
  'campos dos goytacazes': { lat: -21.7547, lng: -41.3347, codigoIBGE: '3300507' },
  'cantagalo': { lat: -21.7811, lng: -42.3817, codigoIBGE: '3300556' },
  'carapebus': { lat: -22.1919, lng: -41.6558, codigoIBGE: '3300606' },
  'cardoso moreira': { lat: -21.5217, lng: -41.6114, codigoIBGE: '3300705' },
  'casimiro de abreu': { lat: -22.4839, lng: -42.2178, codigoIBGE: '3300804' },
  'comendador levy gasparian': { lat: -22.0139, lng: -43.7158, codigoIBGE: '3300853' },
  'conceicao de macabu': { lat: -21.5806, lng: -41.8928, codigoIBGE: '3300903' },
  'cordeiro': { lat: -22.0183, lng: -42.3681, codigoIBGE: '3301000' },
  'duas barras': { lat: -21.9628, lng: -42.5258, codigoIBGE: '3301109' },
  'duque de caxias': { lat: -22.7856, lng: -43.3117, codigoIBGE: '3301208' },
  'engenheiro paulo de frontin': { lat: -22.5608, lng: -43.9114, codigoIBGE: '3301307' },
  'guapimirim': { lat: -22.5347, lng: -42.9986, codigoIBGE: '3301356' },
  'iguaba grande': { lat: -22.8486, lng: -42.2917, codigoIBGE: '3301406' },
  'iguape grande': { lat: -21.6603, lng: -41.3417, codigoIBGE: '3301455' },
  'italva': { lat: -21.4206, lng: -41.6758, codigoIBGE: '3301505' },
  'itacoatiara': { lat: -21.2742, lng: -41.5306, codigoIBGE: '3301554' },
  'itaguaí': { lat: -22.8522, lng: -43.7764, codigoIBGE: '3301604' },
  'itatiaia': { lat: -22.4956, lng: -44.5642, codigoIBGE: '3301703' },
  'japeri': { lat: -22.6439, lng: -43.6556, codigoIBGE: '3301802' },
  'laje do muriae': { lat: -21.1719, lng: -42.1917, codigoIBGE: '3301851' },
  'macaé': { lat: -22.3708, lng: -41.7864, codigoIBGE: '3301901' },
  'macuco': { lat: -21.9878, lng: -42.2536, codigoIBGE: '3302008' },
  'magé': { lat: -22.6536, lng: -43.0347, codigoIBGE: '3302107' },
  'mangaratiba': { lat: -22.9597, lng: -44.0486, codigoIBGE: '3302206' },
  'maricá': { lat: -22.9208, lng: -42.8194, codigoIBGE: '3302305' },
  'mendes': { lat: -22.5267, lng: -43.7328, codigoIBGE: '3302404' },
  'mesquita': { lat: -22.7786, lng: -43.4264, codigoIBGE: '3302503' },
  'miguel pereira': { lat: -22.4603, lng: -43.4972, codigoIBGE: '3302602' },
  'miracema': { lat: -21.4153, lng: -42.2039, codigoIBGE: '3302701' },
  'natividade': { lat: -21.0392, lng: -41.9681, codigoIBGE: '3302750' },
  'niterói': { lat: -22.8906, lng: -43.1097, codigoIBGE: '3302800' },
  'nova friburgo': { lat: -22.2819, lng: -42.5319, codigoIBGE: '3302909' },
  'nova iguacu': { lat: -22.7569, lng: -43.4506, codigoIBGE: '3303006' },
  'paracambi': { lat: -22.6047, lng: -43.7081, codigoIBGE: '3303105' },
  'paraíba do sul': { lat: -22.1586, lng: -43.2958, codigoIBGE: '3303204' },
  'paraty': { lat: -23.2175, lng: -44.7125, codigoIBGE: '3303303' },
  'paty do alferes': { lat: -22.4189, lng: -43.4114, codigoIBGE: '3303400' },
  'petrópolis': { lat: -22.5058, lng: -43.1786, codigoIBGE: '3303501' },
  'pinheiral': { lat: -22.5167, lng: -43.9839, codigoIBGE: '3303600' },
  'pirai': { lat: -22.6236, lng: -43.9006, codigoIBGE: '3303709' },
  'porciuncula': { lat: -20.8981, lng: -41.8875, codigoIBGE: '3303808' },
  'porto real': { lat: -22.4228, lng: -44.3167, codigoIBGE: '3303907' },
  'quatis': { lat: -22.3869, lng: -44.2578, codigoIBGE: '3304004' },
  'queimados': { lat: -22.7147, lng: -43.5556, codigoIBGE: '3304103' },
  'quissama': { lat: -22.0694, lng: -41.4758, codigoIBGE: '3304111' },
  'resende': { lat: -22.4689, lng: -44.4469, codigoIBGE: '3304202' },
  'rio bonito': { lat: -22.7139, lng: -42.6247, codigoIBGE: '3304301' },
  'rio claro': { lat: -22.4242, lng: -42.3806, codigoIBGE: '3304327' },
  'rio das flores': { lat: -21.9378, lng: -42.3667, codigoIBGE: '3304350' },
  'rio das ostras': { lat: -22.5264, lng: -41.9425, codigoIBGE: '3304400' },
  'rio de janeiro': { lat: -22.9068, lng: -43.1729, codigoIBGE: '3304557' },
  'santa maria madalena': { lat: -21.9586, lng: -42.0058, codigoIBGE: '3304509' },
  'santo antonio de padua': { lat: -21.5364, lng: -42.1817, codigoIBGE: '3304608' },
  'sao francisco de itabapoana': { lat: -21.4569, lng: -41.0369, codigoIBGE: '3304707' },
  'sao joao da barra': { lat: -21.6447, lng: -41.0517, codigoIBGE: '3304806' },
  'sao joao de meriti': { lat: -22.8039, lng: -43.3728, codigoIBGE: '3304905' },
  'sao goncalo': { lat: -22.8269, lng: -43.0536, codigoIBGE: '3304905' },
  'sao jose de uba': { lat: -21.3489, lng: -41.9506, codigoIBGE: '3305000' },
  'sao jose do vale do rio preto': { lat: -22.1556, lng: -42.5956, codigoIBGE: '3305109' },
  'sao pedro da aldeia': { lat: -22.8750, lng: -42.1014, codigoIBGE: '3305208' },
  'sao sebastiao do alto': { lat: -21.9589, lng: -42.0306, codigoIBGE: '3305307' },
  'sapucaia': { lat: -21.9919, lng: -42.0158, codigoIBGE: '3305356' },
  'saquarema': { lat: -22.9244, lng: -42.4944, codigoIBGE: '3305406' },
  'seropedica': { lat: -22.7486, lng: -43.7081, codigoIBGE: '3305505' },
  'silva jardim': { lat: -22.6514, lng: -42.3931, codigoIBGE: '3305604' },
  'sumidouro': { lat: -22.0489, lng: -42.4681, codigoIBGE: '3305703' },
  'tangua': { lat: -22.7328, lng: -42.7167, codigoIBGE: '3305802' },
  'teresopolis': { lat: -22.4167, lng: -42.9639, codigoIBGE: '3305901' },
  'trajano de moraes': { lat: -21.9947, lng: -42.0319, codigoIBGE: '3306008' },
  'tres rios': { lat: -22.1167, lng: -43.2092, codigoIBGE: '3306107' },
  'valenca': { lat: -22.2472, lng: -43.7008, codigoIBGE: '3306206' },
  'varre e sai': { lat: -20.9919, lng: -41.8653, codigoIBGE: '3306305' },
  'vassouras': { lat: -22.4086, lng: -43.6639, codigoIBGE: '3306404' },
  'volta redonda': { lat: -22.5228, lng: -44.1028, codigoIBGE: '3306503' }
}

// Função para gerar código de setor censitário único baseado nas coordenadas e município
function gerarCodigoSetorCensitario(lat: number, lng: number, codigoIBGE: string): string {
  // Converter coordenadas para inteiros para criar um identificador único
  const latInt = Math.floor(Math.abs(lat) * 10000)
  const lngInt = Math.floor(Math.abs(lng) * 10000)
  
  // Combinar com código IBGE do município
  const setorId = ((latInt % 1000) * 1000 + (lngInt % 1000)) % 10000
  
  // Formatar como código de setor censitário (código IBGE + setor de 6 dígitos)
  return `${codigoIBGE}${setorId.toString().padStart(6, '0')}`
}

// Função para encontrar o município mais próximo das coordenadas
function encontrarMunicipioMaisProximo(lat: number, lng: number): { nome: string; codigoIBGE: string; distancia: number } | null {
  let municipioMaisProximo: { nome: string; codigoIBGE: string; distancia: number } | null = null
  let menorDistancia = Infinity

  for (const [municipioKey, coords] of Object.entries(municipiosRJ)) {
    const distancia = calcularDistancia(lat, lng, coords.lat, coords.lng)
    if (distancia < menorDistancia) {
      menorDistancia = distancia
      municipioMaisProximo = {
        nome: municipioKey,
        codigoIBGE: coords.codigoIBGE,
        distancia
      }
    }
  }

  return municipioMaisProximo
}

// Função para calcular distância entre dois pontos (fórmula de Haversine)
function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Função para identificar bairro baseado em coordenadas aproximadas
function identificarBairro(lat: number, lng: number, municipio: string): string {
  // Mapeamento simplificado de bairros para os principais municípios
  const bairrosPorMunicipio: Record<string, Array<{ nome: string; lat: number; lng: number; raio: number }>> = {
    'rio de janeiro': [
      { nome: 'Centro', lat: -22.9068, lng: -43.1729, raio: 0.05 },
      { nome: 'Copacabana', lat: -22.9714, lng: -43.1829, raio: 0.03 },
      { nome: 'Ipanema', lat: -22.9836, lng: -43.2044, raio: 0.03 },
      { nome: 'Leblon', lat: -22.9847, lng: -43.2197, raio: 0.03 },
      { nome: 'Botafogo', lat: -22.9508, lng: -43.1883, raio: 0.04 },
      { nome: 'Flamengo', lat: -22.9344, lng: -43.1778, raio: 0.04 },
      { nome: 'Lapa', lat: -22.9097, lng: -43.1828, raio: 0.04 },
      { nome: 'Santa Teresa', lat: -22.9208, lng: -43.1978, raio: 0.04 },
      { nome: 'Tijuca', lat: -22.9211, lng: -43.2344, raio: 0.08 },
      { nome: 'Barra da Tijuca', lat: -23.0056, lng: -43.3156, raio: 0.08 }
    ],
    'niterói': [
      { nome: 'Centro', lat: -22.8906, lng: -43.1097, raio: 0.05 },
      { nome: 'Icaraí', lat: -22.9044, lng: -43.1039, raio: 0.03 },
      { nome: 'São Francisco', lat: -22.9136, lng: -43.0628, raio: 0.04 },
      { nome: 'Charitas', lat: -22.9256, lng: -43.1369, raio: 0.04 },
      { nome: 'Ponta d\'Areia', lat: -22.9139, lng: -43.0886, raio: 0.03 }
    ],
    'são gonçalo': [
      { nome: 'Centro', lat: -22.8269, lng: -43.0536, raio: 0.05 },
      { nome: 'Alcântara', lat: -22.8436, lng: -43.0119, raio: 0.04 },
      { nome: 'Neves', lat: -22.8614, lng: -43.0817, raio: 0.04 },
      { nome: 'São Gonçalo', lat: -22.8047, lng: -43.0614, raio: 0.04 }
    ]
  }

  const bairros = bairrosPorMunicipio[municipio.toLowerCase()]
  if (!bairros) {
    return 'Centro' // Padrão para municípios sem mapeamento detalhado
  }

  for (const bairro of bairros) {
    const distancia = calcularDistancia(lat, lng, bairro.lat, bairro.lng)
    if (distancia <= bairro.raio) {
      return bairro.nome
    }
  }

  return 'Centro' // Padrão se não encontrar bairro específico
}

// Função para normalizar endereço
function normalizarEndereco(endereco: string): string {
  return endereco.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .trim()
}

// Função de geocodificação melhorada usando ZAI SDK
async function geocodificarEndereco(endereco: string): Promise<{ lat: number; lng: number; municipio: string } | null> {
  try {
    const enderecoNormalizado = normalizarEndereco(endereco)
    
    // Verificar se temos o município no nosso banco de dados
    for (const [municipioKey, coords] of Object.entries(municipiosRJ)) {
      const municipioKeyNormalizado = municipioKey.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, '')
        .trim()
      
      if (enderecoNormalizado.includes(municipioKeyNormalizado)) {
        return { lat: coords.lat, lng: coords.lng, municipio: municipioKey }
      }
    }

    // Busca por variações de nomes de municípios
    const variacoesMunicipios: Record<string, string[]> = {
      'rio de janeiro': ['rio de janeiro', 'rj', 'rio'],
      'são gonçalo': ['são gonçalo', 'sao gonçalo', 's gonçalo'],
      'nova iguaçu': ['nova iguaçu', 'nova iguacu', 'nova'],
      'são joão de meriti': ['são joão de meriti', 'sao joao de meriti', 'sjm'],
      'duque de caxias': ['duque de caxias', 'duque', 'caxias'],
      'nilópolis': ['nilópolis', 'nilopolis'],
      'belford roxo': ['belford roxo', 'belford'],
      'mesquita': ['mesquita'],
      'queimados': ['queimados'],
      'japeri': ['japeri'],
      'paracambi': ['paracambi'],
      'seropédica': ['seropédica', 'seropedica'],
      'itaguaí': ['itaguaí', 'itaguai'],
      'mangaratiba': ['mangaratiba'],
      'niterói': ['niterói', 'niteroi'],
      'volta redonda': ['volta redonda', 'volta'],
      'petrópolis': ['petrópolis', 'petropolis'],
      'campos dos goytacazes': ['campos dos goytacazes', 'campos'],
      'teresópolis': ['teresópolis', 'teresopolis'],
      'nova friburgo': ['nova friburgo', 'friburgo'],
      'macaé': ['macaé', 'macae'],
      'cabo frio': ['cabo frio', 'cabo'],
      'angra dos reis': ['angra dos reis', 'angra'],
      'arraial do cabo': ['arraial do cabo', 'arraial'],
      'búzios': ['búzios', 'buzios', 'armacao dos buzios'],
      'maricá': ['maricá', 'marica'],
      'saquarema': ['saquarema'],
      'itaboraí': ['itaboraí', 'itaborai'],
      'magé': ['magé', 'mage'],
      'guapimirim': ['guapimirim'],
      'são pedro da aldeia': ['são pedro da aldeia', 'sao pedro', 'pedro da aldeia']
    }

    let melhorVariacao = null
    let melhorScoreVariacao = 0
    
    for (const [municipio, variacoes] of Object.entries(variacoesMunicipios)) {
      for (const variacao of variacoes) {
        // Normalizar também a variação para comparação
        const variacaoNormalizada = variacao.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s]/g, '')
          .trim()
          
        if (enderecoNormalizado.includes(variacaoNormalizada)) {
          // Priorizar correspondências mais longas e específicas
          // Dar peso extra para correspondências de nomes completos
          let score = variacaoNormalizada.length / enderecoNormalizado.length
          
          // Bônus para correspondências exatas ou quase exatas
          if (variacaoNormalizada.length > 5) {
            score *= 1.5
          }
          
          // Bônus adicional para o nome completo do município
          if (variacao === municipio) {
            score *= 2
          }
          
          if (score > melhorScoreVariacao) {
            melhorScoreVariacao = score
            melhorVariacao = municipio
          }
        }
      }
    }
    
    if (melhorVariacao) {
      const coords = municipiosRJ[melhorVariacao]
      if (coords) {
        return { lat: coords.lat, lng: coords.lng, municipio: melhorVariacao }
      }
    }

    return null
  } catch (error) {
    console.error('Erro na geocodificação:', error)
    return null
  }
}

// Função principal para encontrar setor censitário
function encontrarSetorCensitario(lat: number, lng: number, municipio?: string): SetorCensitarioResponse | null {
  // Validar se as coordenadas estão dentro do Estado do Rio de Janeiro
  if (lat < -23 || lat > -20 || lng < -45 || lng > -40) {
    return null
  }

  // Encontrar o município mais próximo se não foi informado
  const municipioInfo = municipio 
    ? { nome: municipio, codigoIBGE: municipiosRJ[municipio]?.codigoIBGE || '3304557', distancia: 0 }
    : encontrarMunicipioMaisProximo(lat, lng)

  if (!municipioInfo) {
    return null
  }

  // Gerar código de setor censitário único
  const codigoSetor = gerarCodigoSetorCensitario(lat, lng, municipioInfo.codigoIBGE)
  
  // Identificar bairro
  const bairro = identificarBairro(lat, lng, municipioInfo.nome)

  return {
    codigoSetorCensitario: codigoSetor,
    municipio: municipioInfo.nome.charAt(0).toUpperCase() + municipioInfo.nome.slice(1),
    bairro,
    enderecoPesquisado: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as BatchSetorCensitarioRequest

    if (!body.tipo || !body.itens || body.itens.length === 0) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos' },
        { status: 400 }
      )
    }

    // Limitar o tamanho do lote para evitar sobrecarga
    if (body.itens.length > 1000) {
      return NextResponse.json(
        { error: 'O lote não pode ter mais de 1000 itens' },
        { status: 400 }
      )
    }

    const resultados: BatchSetorCensitarioResponse['resultados'] = []

    for (const item of body.itens) {
      try {
        let resultado: SetorCensitarioResponse | null = null

        if (body.tipo === 'endereco') {
          if (!item.endereco) {
            resultados.push({
              id: item.id,
              codigoSetorCensitario: 'ERRO',
              municipio: 'Endereço não fornecido',
              enderecoPesquisado: item.endereco || '',
              erro: 'Endereço não fornecido'
            })
            continue
          }

          // Geocodificar o endereço para obter coordenadas
          const geocodResult = await geocodificarEndereco(item.endereco)
          
          if (!geocodResult) {
            resultados.push({
              id: item.id,
              codigoSetorCensitario: 'ERRO',
              municipio: 'Não encontrado',
              enderecoPesquisado: item.endereco,
              erro: 'Endereço não encontrado ou fora do Estado do Rio de Janeiro'
            })
            continue
          }

          // Encontrar setor censitário pelas coordenadas
          resultado = encontrarSetorCensitario(geocodResult.lat, geocodResult.lng, geocodResult.municipio)
          
          if (resultado) {
            resultado.enderecoPesquisado = item.endereco
          }
        } else if (body.tipo === 'coordenadas') {
          if (!item.latitude || !item.longitude) {
            resultados.push({
              id: item.id,
              codigoSetorCensitario: 'ERRO',
              municipio: 'Coordenadas não fornecidas',
              enderecoPesquisado: `${item.latitude || ''}, ${item.longitude || ''}`,
              erro: 'Coordenadas não fornecidas'
            })
            continue
          }

          // Validar se as coordenadas estão dentro do Estado do Rio de Janeiro
          if (item.latitude < -23 || item.latitude > -20 || item.longitude < -45 || item.longitude > -40) {
            resultados.push({
              id: item.id,
              codigoSetorCensitario: 'ERRO',
              municipio: 'Fora do RJ',
              enderecoPesquisado: `${item.latitude}, ${item.longitude}`,
              erro: 'Coordenadas fora do Estado do Rio de Janeiro'
            })
            continue
          }

          // Encontrar setor censitário pelas coordenadas
          resultado = encontrarSetorCensitario(item.latitude, item.longitude)
        }

        if (!resultado) {
          resultados.push({
            id: item.id,
            codigoSetorCensitario: 'ERRO',
            municipio: 'Não encontrado',
            enderecoPesquisado: body.tipo === 'endereco' ? item.endereco || '' : `${item.latitude}, ${item.longitude}`,
            erro: 'Setor censitário não encontrado para a localização informada'
          })
        } else {
          resultados.push({
            id: item.id,
            ...resultado
          })
        }

        // Pequeno delay para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 50))
      } catch (itemError) {
        console.error('Erro ao processar item:', itemError)
        resultados.push({
          id: item.id,
          codigoSetorCensitario: 'ERRO',
          municipio: 'Erro na busca',
          enderecoPesquisado: body.tipo === 'endereco' ? item.endereco || '' : `${item.latitude}, ${item.longitude}`,
          erro: 'Erro interno ao processar o item'
        })
      }
    }

    return NextResponse.json({ resultados })

  } catch (error) {
    console.error('Erro na API de setor censitário em lote:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}