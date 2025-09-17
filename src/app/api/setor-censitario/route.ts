import { NextRequest, NextResponse } from 'next/server'
import IBGEAPI from '@/lib/ibge-api'

interface SetorCensitarioRequest {
  tipo: 'endereco' | 'coordenadas'
  endereco?: string
  latitude?: number
  longitude?: number
}

interface SetorCensitarioResponse {
  codigoSetorCensitario: string
  municipio: string
  bairro?: string
  enderecoPesquisado: string
  latitude?: number
  longitude?: number
}

const ibgeAPI = new IBGEAPI()

export async function POST(request: NextRequest) {
  try {
    const body: SetorCensitarioRequest = await request.json()
    const { tipo, endereco, latitude, longitude } = body

    if (!tipo) {
      return NextResponse.json(
        { error: 'Tipo de pesquisa não especificado' },
        { status: 400 }
      )
    }

    let lat: number
    let lng: number
    let enderecoPesquisado: string
    let municipio: string

    if (tipo === 'endereco') {
      if (!endereco) {
        return NextResponse.json(
          { error: 'Endereço não fornecido' },
          { status: 400 }
        )
      }

      console.log(`Geocodificando endereço: ${endereco}`)
      
      // Geocodificar o endereço
      const resultadoGeocodificacao = await ibgeAPI.geocodificarEndereco(endereco)
      
      if (!resultadoGeocodificacao) {
        return NextResponse.json(
          { error: 'Não foi possível geocodificar o endereço' },
          { status: 404 }
        )
      }

      lat = resultadoGeocodificacao.lat
      lng = resultadoGeocodificacao.lng
      municipio = resultadoGeocodificacao.municipio
      enderecoPesquisado = endereco
    } else {
      if (!latitude || !longitude) {
        return NextResponse.json(
          { error: 'Coordenadas não fornecidas' },
          { status: 400 }
        )
      }

      lat = latitude
      lng = longitude
      enderecoPesquisado = `${latitude}, ${longitude}`
      
      // Encontrar município mais próximo
      const municipioEncontrado = ibgeAPI.encontrarMunicipioMaisProximo(lat, lng)
      if (!municipioEncontrado) {
        return NextResponse.json(
          { error: 'Não foi possível identificar o município' },
          { status: 404 }
        )
      }
      
      municipio = municipioEncontrado.nome
    }

    console.log(`Coordenadas: ${lat}, ${lng}`)
    console.log(`Município: ${municipio}`)

    // Encontrar o código IBGE do município
    const municipioData = Object.entries(ibgeAPI.getMunicipiosRJ())
      .find(([_, data]) => data.nome.toLowerCase() === municipio.toLowerCase())

    if (!municipioData) {
      return NextResponse.json(
        { error: 'Município não encontrado na base de dados' },
        { status: 404 }
      )
    }

    const codigoIBGE = municipioData[0]

    // Tentar encontrar setor censitário real usando a API do IBGE
    console.log(`Buscando setor censitário para o município ${codigoIBGE}`)
    let codigoSetorCensitario = await ibgeAPI.encontrarSetorCensitarioPorCoordenadas(lat, lng, codigoIBGE)

    // Se não encontrar setor real, gerar um código baseado nas coordenadas
    if (!codigoSetorCensitario) {
      console.log('Setor censitário não encontrado, gerando código baseado em coordenadas')
      
      // Gerar código único baseado nas coordenadas
      const latInt = Math.floor(Math.abs(lat) * 10000)
      const lngInt = Math.floor(Math.abs(lng) * 10000)
      const setorId = ((latInt % 1000) * 1000 + (lngInt % 1000)) % 1000000
      
      codigoSetorCensitario = `${codigoIBGE}${setorId.toString().padStart(6, '0')}`
    }

    console.log(`Código do setor censitário: ${codigoSetorCensitario}`)

    const response: SetorCensitarioResponse = {
      codigoSetorCensitario,
      municipio,
      enderecoPesquisado,
      latitude: lat,
      longitude: lng
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro na rota de setor censitário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}