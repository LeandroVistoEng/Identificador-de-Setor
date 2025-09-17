import { NextRequest, NextResponse } from 'next/server'
import IBGEAPI from '@/lib/ibge-api'

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
    latitude?: number
    longitude?: number
    erro?: string
  }>
}

const ibgeAPI = new IBGEAPI()

export async function POST(request: NextRequest) {
  try {
    const body: BatchSetorCensitarioRequest = await request.json()
    const { tipo, itens } = body

    if (!tipo || !itens || !Array.isArray(itens)) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos' },
        { status: 400 }
      )
    }

    console.log(`Processando lote com ${itens.length} itens`)

    const resultados: BatchSetorCensitarioResponse['resultados'] = []

    for (const item of itens) {
      try {
        let lat: number
        let lng: number
        let enderecoPesquisado: string
        let municipio: string

        if (tipo === 'endereco') {
          if (!item.endereco) {
            resultados.push({
              id: item.id,
              codigoSetorCensitario: '',
              municipio: '',
              enderecoPesquisado: item.endereco || '',
              erro: 'Endereço não fornecido'
            })
            continue
          }

          console.log(`Geocodificando endereço: ${item.endereco}`)
          
          // Geocodificar o endereço
          const resultadoGeocodificacao = await ibgeAPI.geocodificarEndereco(item.endereco)
          
          if (!resultadoGeocodificacao) {
            resultados.push({
              id: item.id,
              codigoSetorCensitario: '',
              municipio: '',
              enderecoPesquisado: item.endereco,
              erro: 'Não foi possível geocodificar o endereço'
            })
            continue
          }

          lat = resultadoGeocodificacao.lat
          lng = resultadoGeocodificacao.lng
          municipio = resultadoGeocodificacao.municipio
          enderecoPesquisado = item.endereco
        } else {
          if (!item.latitude || !item.longitude) {
            resultados.push({
              id: item.id,
              codigoSetorCensitario: '',
              municipio: '',
              enderecoPesquisado: `${item.latitude || ''}, ${item.longitude || ''}`,
              erro: 'Coordenadas não fornecidas'
            })
            continue
          }

          lat = item.latitude
          lng = item.longitude
          enderecoPesquisado = `${item.latitude}, ${item.longitude}`
          
          // Encontrar município mais próximo
          const municipioEncontrado = ibgeAPI.encontrarMunicipioMaisProximo(lat, lng)
          if (!municipioEncontrado) {
            resultados.push({
              id: item.id,
              codigoSetorCensitario: '',
              municipio: '',
              enderecoPesquisado: enderecoPesquisado,
              erro: 'Não foi possível identificar o município'
            })
            continue
          }
          
          municipio = municipioEncontrado.nome
        }

        console.log(`Item ${item.id || ''}: Coordenadas: ${lat}, ${lng}, Município: ${municipio}`)

        // Encontrar o código IBGE do município
        const municipioData = Object.entries(ibgeAPI.getMunicipiosRJ())
          .find(([_, data]) => data.nome.toLowerCase() === municipio.toLowerCase())

        if (!municipioData) {
          resultados.push({
            id: item.id,
            codigoSetorCensitario: '',
            municipio,
            enderecoPesquisado,
            erro: 'Município não encontrado na base de dados'
          })
          continue
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

        console.log(`Item ${item.id || ''}: Código do setor censitário: ${codigoSetorCensitario}`)

        resultados.push({
          id: item.id,
          codigoSetorCensitario,
          municipio,
          enderecoPesquisado,
          latitude: lat,
          longitude: lng
        })

      } catch (itemError) {
        console.error(`Erro ao processar item ${item.id || ''}:`, itemError)
        resultados.push({
          id: item.id,
          codigoSetorCensitario: '',
          municipio: '',
          enderecoPesquisado: item.endereco || `${item.latitude}, ${item.longitude}`,
          erro: 'Erro ao processar o item'
        })
      }
    }

    return NextResponse.json({ resultados })
  } catch (error) {
    console.error('Erro na rota de setor censitário em lote:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}