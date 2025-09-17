// Cliente para API do IBGE - Setores Censitários
interface IBGESetorCensitario {
  id_setor: string
  nome_setor: string
  situacao_setor: string
  cod_municipio: string
  nome_municipio: string
  cod_distrito: string
  nome_distrito: string
  cod_subdistrito: string
  nome_subdistrito: string
  cod_bairro: string
  nome_bairro: string
  geometry?: {
    type: string
    coordinates: number[][][]
  }
}

interface IBGEMunicipio {
  id: string
  nome: string
  microrregiao: {
    id: string
    nome: string
    mesorregiao: {
      id: string
      nome: string
      UF: {
        id: string
        sigla: string
        nome: string
        regiao: {
          id: string
          nome: string
          sigla: string
        }
      }
    }
  }
}

class IBGEAPI {
  private baseUrl = 'https://servicodados.ibge.gov.br/api/v2'

  async buscarMunicipiosPorUF(uf: string): Promise<IBGEMunicipio[]> {
    try {
      const response = await fetch(`${this.baseUrl}/localidades/estados/${uf}/municipios`)
      if (!response.ok) {
        throw new Error(`Erro ao buscar municípios: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar municípios:', error)
      return []
    }
  }

  async buscarSetoresCensitariosPorMunicipio(codMunicipio: string): Promise<IBGESetorCensitario[]> {
    try {
      const response = await fetch(`${this.baseUrl}/malhas/${codMunicipio}/setores?formato=application/vnd.geo+json`)
      if (!response.ok) {
        throw new Error(`Erro ao buscar setores censitários: ${response.status}`)
      }
      const data = await response.json()
      return data.features || []
    } catch (error) {
      console.error('Erro ao buscar setores censitários:', error)
      return []
    }
  }

  // Função para buscar coordenadas de um endereço usando geocodificação do IBGE
  async geocodificarEndereco(endereco: string): Promise<{ lat: number; lng: number; municipio: string } | null> {
    try {
      // Usar a API de geocodificação do IBGE
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1&countrycodes=br`)
      if (!response.ok) {
        throw new Error(`Erro na geocodificação: ${response.status}`)
      }
      
      const data = await response.json()
      if (data && data.length > 0) {
        const result = data[0]
        const lat = parseFloat(result.lat)
        const lng = parseFloat(result.lon)
        
        // Extrair município do display_name ou address
        let municipio = ''
        if (result.address) {
          // Tentar encontrar o município na estrutura de endereço
          municipio = result.address.city || result.address.town || result.address.municipality || result.address.state_district || ''
        }
        
        // Se não encontrar, tentar extrair do display_name
        if (!municipio && result.display_name) {
          const partes = result.display_name.split(',')
          // Procurar por municípios conhecidos do Rio de Janeiro
          const municipiosRJ = Object.values(this.getMunicipiosRJ()).map(m => m.nome.toLowerCase())
          for (const parte of partes) {
            const parteLimpa = parte.trim().toLowerCase()
            if (municipiosRJ.includes(parteLimpa)) {
              municipio = parte.trim()
              break
            }
          }
        }
        
        // Se ainda não encontrou, usar o estado como fallback
        if (!municipio && result.address && result.address.state === 'Rio de Janeiro') {
          municipio = 'Rio de Janeiro' // Padrão para endereços no RJ
        }
        
        return {
          lat,
          lng,
          municipio
        }
      }
      return null
    } catch (error) {
      console.error('Erro na geocodificação:', error)
      return null
    }
  }

  // Função simplificada para encontrar setor censitário baseado em coordenadas
  async encontrarSetorCensitarioPorCoordenadas(lat: number, lng: number, codMunicipio: string): Promise<string | null> {
    try {
      // Buscar setores censitários do município
      const setores = await this.buscarSetoresCensitariosPorMunicipio(codMunicipio)
      
      // Encontrar o setor mais próximo (simplificado)
      let setorMaisProximo: IBGESetorCensitario | null = null
      let menorDistancia = Infinity

      for (const setor of setores) {
        if (setor.geometry && setor.geometry.coordinates && setor.geometry.coordinates[0]) {
          // Calcular centroide do polígono (simplificado)
          const coords = setor.geometry.coordinates[0]
          const centroLat = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length
          const centroLng = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length
          
          const distancia = this.calcularDistancia(lat, lng, centroLat, centroLng)
          
          if (distancia < menorDistancia) {
            menorDistancia = distancia
            setorMaisProximo = setor
          }
        }
      }

      return setorMaisProximo?.id_setor || null
    } catch (error) {
      console.error('Erro ao encontrar setor censitário:', error)
      return null
    }
  }

  // Calcular distância entre dois pontos (fórmula de Haversine)
  private calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Municípios do Rio de Janeiro com códigos IBGE (dados básicos)
  getMunicipiosRJ(): Record<string, { nome: string; codigoIBGE: string; lat: number; lng: number }> {
    return {
      '3304557': { nome: 'Rio de Janeiro', codigoIBGE: '3304557', lat: -22.9068, lng: -43.1729 },
      '3302800': { nome: 'Niterói', codigoIBGE: '3302800', lat: -22.8906, lng: -43.1097 },
      '3304905': { nome: 'São Gonçalo', codigoIBGE: '3304905', lat: -22.8269, lng: -43.0536 },
      '3303006': { nome: 'Nova Iguaçu', codigoIBGE: '3303006', lat: -22.7569, lng: -43.4506 },
      '3301208': { nome: 'Duque de Caxias', codigoIBGE: '3301208', lat: -22.7856, lng: -43.3117 },
      '3303501': { nome: 'Petrópolis', codigoIBGE: '3303501', lat: -22.5058, lng: -43.1786 },
      '3306503': { nome: 'Volta Redonda', codigoIBGE: '3306503', lat: -22.5228, lng: -44.1028 },
      '3300507': { nome: 'Campos dos Goytacazes', codigoIBGE: '3300507', lat: -21.7547, lng: -41.3347 },
      '3305901': { nome: 'Teresópolis', codigoIBGE: '3305901', lat: -22.4167, lng: -42.9639 },
      '3301901': { nome: 'Macaé', codigoIBGE: '3301901', lat: -22.3708, lng: -41.7864 },
      '3300452': { nome: 'Cabo Frio', codigoIBGE: '3300452', lat: -22.8781, lng: -42.0197 },
      '3300100': { nome: 'Angra dos Reis', codigoIBGE: '3300100', lat: -23.0067, lng: -44.3181 }
    }
  }

  // Encontrar município mais próximo das coordenadas
  encontrarMunicipioMaisProximo(lat: number, lng: number): { nome: string; codigoIBGE: string } | null {
    const municipios = this.getMunicipiosRJ()
    let municipioMaisProximo: { nome: string; codigoIBGE: string } | null = null
    let menorDistancia = Infinity

    for (const [codigo, municipio] of Object.entries(municipios)) {
      const distancia = this.calcularDistancia(lat, lng, municipio.lat, municipio.lng)
      if (distancia < menorDistancia) {
        menorDistancia = distancia
        municipioMaisProximo = {
          nome: municipio.nome,
          codigoIBGE: municipio.codigoIBGE
        }
      }
    }

    return municipioMaisProximo
  }
}

export default IBGEAPI
export type { IBGESetorCensitario, IBGEMunicipio }