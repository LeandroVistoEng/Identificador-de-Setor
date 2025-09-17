'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { MapPin, Navigation, Download, Upload, FileText } from 'lucide-react'

interface SearchResult {
  codigoSetorCensitario: string
  municipio: string
  bairro?: string
  enderecoPesquisado: string
}

export default function Home() {
  const [endereco, setEndereco] = useState('')
  const [enderecosLote, setEnderecosLote] = useState('')
  const [coordenadasLote, setCoordenadasLote] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingLote, setLoadingLote] = useState(false)
  const [resultados, setResultados] = useState<SearchResult[]>([])
  const [error, setError] = useState('')
  const [progresso, setProgresso] = useState(0)

  const buscarPorEndereco = async () => {
    if (!endereco.trim()) {
      setError('Por favor, informe um endereço ou município')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/setor-censitario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: 'endereco',
          endereco: endereco.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar setor censitário')
      }

      setResultados([data])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setResultados([])
    } finally {
      setLoading(false)
    }
  }

  const buscarPorCoordenadas = async () => {
    if (!latitude.trim() || !longitude.trim()) {
      setError('Por favor, informe latitude e longitude')
      return
    }

    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)

    if (isNaN(lat) || isNaN(lng)) {
      setError('Coordenadas inválidas')
      return
    }

    if (lat < -23 || lat > -20 || lng < -45 || lng > -40) {
      setError('Coordenadas fora do Estado do Rio de Janeiro')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/setor-censitario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: 'coordenadas',
          latitude: lat,
          longitude: lng,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar setor censitário')
      }

      setResultados([data])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setResultados([])
    } finally {
      setLoading(false)
    }
  }

  // Função para processar múltiplos endereços
  const buscarEnderecosLote = async () => {
    if (!enderecosLote.trim()) {
      setError('Por favor, informe os endereços, um por linha')
      return
    }

    const enderecos = enderecosLote.trim().split('\n').filter(e => e.trim())
    if (enderecos.length === 0) {
      setError('Nenhum endereço válido encontrado')
      return
    }

    setLoadingLote(true)
    setError('')
    setResultados([])
    setProgresso(0)

    try {
      // Preparar dados para a API de lote
      const itens = enderecos.map((endereco, index) => ({
        id: `endereco_${index + 1}`,
        endereco: endereco.trim()
      }))

      const response = await fetch('/api/setor-censitario-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: 'endereco',
          itens,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar lote de endereços')
      }

      setResultados(data.resultados)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setResultados([])
    } finally {
      setLoadingLote(false)
      setProgresso(0)
    }
  }

  // Função para processar múltiplas coordenadas
  const buscarCoordenadasLote = async () => {
    if (!coordenadasLote.trim()) {
      setError('Por favor, informe as coordenadas, uma por linha (latitude,longitude)')
      return
    }

    const linhas = coordenadasLote.trim().split('\n').filter(l => l.trim())
    if (linhas.length === 0) {
      setError('Nenhuma coordenada válida encontrada')
      return
    }

    setLoadingLote(true)
    setError('')
    setResultados([])
    setProgresso(0)

    try {
      // Preparar dados para a API de lote
      const itens = linhas.map((linha, index) => {
        const [lat, lng] = linha.split(',').map(c => parseFloat(c.trim()))
        return {
          id: `coord_${index + 1}`,
          latitude: lat,
          longitude: lng
        }
      })

      const response = await fetch('/api/setor-censitario-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: 'coordenadas',
          itens,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar lote de coordenadas')
      }

      setResultados(data.resultados)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setResultados([])
    } finally {
      setLoadingLote(false)
      setProgresso(0)
    }
  }

  // Função para processar arquivo CSV
  const processarArquivoCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0]
    if (!arquivo) return

    setLoadingLote(true)
    setError('')
    setResultados([])
    setProgresso(0)

    try {
      const texto = await arquivo.text()
      const linhas = texto.split('\n').filter(l => l.trim())
      
      if (linhas.length === 0) {
        setError('Arquivo vazio ou sem dados válidos')
        return
      }
      
      // Pular cabeçalho se existir
      const primeiraLinha = linhas[0].toLowerCase()
      const temCabecalho = primeiraLinha.includes('endereco') || 
                          primeiraLinha.includes('endereço') || 
                          primeiraLinha.includes('latitude')
      
      const linhasDados = temCabecalho ? linhas.slice(1) : linhas
      
      // Preparar itens para processamento em lote
      const itensEndereco: Array<{ id: string; endereco: string }> = []
      const itensCoordenadas: Array<{ id: string; latitude: number; longitude: number }> = []
      
      for (let i = 0; i < linhasDados.length; i++) {
        const linha = linhasDados[i].trim()
        
        if (!linha) continue
        
        // Tentar detectar se é endereço ou coordenadas
        if (linha.includes(',')) {
          const partes = linha.split(',').map(p => p.trim().replace(/['"]/g, ''))
          
          // Se tiver duas partes numéricas, trata como coordenadas
          if (partes.length >= 2 && !isNaN(parseFloat(partes[0])) && !isNaN(parseFloat(partes[1]))) {
            const lat = parseFloat(partes[0])
            const lng = parseFloat(partes[1])
            
            if (lat >= -23 && lat <= -20 && lng >= -45 && lng <= -40) {
              itensCoordenadas.push({
                id: `csv_coord_${i + 1}`,
                latitude: lat,
                longitude: lng
              })
            }
          } else {
            // Tratar como endereço
            const endereco = partes.join(', ')
            itensEndereco.push({
              id: `csv_endereco_${i + 1}`,
              endereco
            })
          }
        } else {
          // Tratar como endereço simples
          itensEndereco.push({
            id: `csv_endereco_${i + 1}`,
            endereco: linha
          })
        }
      }
      
      const resultadosFinais: SearchResult[] = []
      
      // Processar endereços em lote
      if (itensEndereco.length > 0) {
        try {
          const response = await fetch('/api/setor-censitario-batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tipo: 'endereco',
              itens: itensEndereco,
            }),
          })
          
          const data = await response.json()
          
          if (response.ok) {
            resultadosFinais.push(...data.resultados)
          }
        } catch (error) {
          console.error('Erro ao processar endereços do CSV:', error)
        }
      }
      
      // Processar coordenadas em lote
      if (itensCoordenadas.length > 0) {
        try {
          const response = await fetch('/api/setor-censitario-batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tipo: 'coordenadas',
              itens: itensCoordenadas,
            }),
          })
          
          const data = await response.json()
          
          if (response.ok) {
            resultadosFinais.push(...data.resultados)
          }
        } catch (error) {
          console.error('Erro ao processar coordenadas do CSV:', error)
        }
      }
      
      setResultados(resultadosFinais)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo')
      setResultados([])
    } finally {
      setLoadingLote(false)
      setProgresso(0)
      // Limpar o input de arquivo
      event.target.value = ''
    }
  }

  const exportarCSV = () => {
    if (resultados.length === 0) return

    const headers = ['Endereço ou Coordenadas', 'Código Setor Censitário', 'Município', 'Bairro']
    const csvContent = [
      headers.join(','),
      ...resultados.map(r => [
        `"${r.enderecoPesquisado}"`,
        `"${r.codigoSetorCensitario}"`,
        `"${r.municipio}"`,
        `"${r.bairro || ''}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'setores_censitarios.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Identificador de Setor Censitário - Rio de Janeiro
          </h1>
          <p className="text-gray-600">
            Encontre o código do setor censitário a partir de endereços ou coordenadas geográficas
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Busca de Setor Censitário
            </CardTitle>
            <CardDescription>
              Informe um endereço completo ou coordenadas geográficas no Estado do Rio de Janeiro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="individual" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="individual">Individual</TabsTrigger>
                <TabsTrigger value="lote-enderecos">Lote - Endereços</TabsTrigger>
                <TabsTrigger value="lote-coordenadas">Lote - Coordenadas</TabsTrigger>
                <TabsTrigger value="arquivo">Arquivo CSV</TabsTrigger>
              </TabsList>
              
              <TabsContent value="individual" className="space-y-4">
                <Tabs defaultValue="endereco" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="endereco">Por Endereço</TabsTrigger>
                    <TabsTrigger value="coordenadas">Por Coordenadas</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="endereco" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="endereco">Endereço ou Município</Label>
                      <Input
                        id="endereco"
                        placeholder="Ex: Rua Primeiro de Março, 100, Centro, Rio de Janeiro, RJ"
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={buscarPorEndereco} 
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Buscando...' : 'Buscar por Endereço'}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="coordenadas" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input
                          id="latitude"
                          placeholder="Ex: -22.9068"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input
                          id="longitude"
                          placeholder="Ex: -43.1729"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={buscarPorCoordenadas} 
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Buscando...' : 'Buscar por Coordenadas'}
                    </Button>
                  </TabsContent>
                </Tabs>
              </TabsContent>
              
              <TabsContent value="lote-enderecos" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="enderecos-lote">Endereços (um por linha)</Label>
                  <Textarea
                    id="enderecos-lote"
                    placeholder="Ex:&#10;Rua Primeiro de Março, 100, Centro, Rio de Janeiro, RJ&#10;Avenida Atlântica, 1500, Copacabana, Rio de Janeiro, RJ&#10;Rua das Flores, 50, Centro, Niterói, RJ"
                    value={enderecosLote}
                    onChange={(e) => setEnderecosLote(e.target.value)}
                    rows={8}
                  />
                  <p className="text-sm text-gray-500">
                    Digite um endereço por linha. O sistema processará todos os endereços em sequência.
                  </p>
                </div>
                <Button 
                  onClick={buscarEnderecosLote} 
                  disabled={loadingLote}
                  className="w-full"
                >
                  {loadingLote ? 'Processando...' : 'Processar Endereços em Lote'}
                </Button>
              </TabsContent>
              
              <TabsContent value="lote-coordenadas" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coordenadas-lote">Coordenadas (uma por linha: latitude,longitude)</Label>
                  <Textarea
                    id="coordenadas-lote"
                    placeholder="Ex:&#10;-22.9068,-43.1729&#10;-22.9714,-43.1829&#10;-22.8906,-43.1097"
                    value={coordenadasLote}
                    onChange={(e) => setCoordenadasLote(e.target.value)}
                    rows={8}
                  />
                  <p className="text-sm text-gray-500">
                    Digite as coordenadas no formato latitude,longitude (uma por linha).
                  </p>
                </div>
                <Button 
                  onClick={buscarCoordenadasLote} 
                  disabled={loadingLote}
                  className="w-full"
                >
                  {loadingLote ? 'Processando...' : 'Processar Coordenadas em Lote'}
                </Button>
              </TabsContent>
              
              <TabsContent value="arquivo" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="arquivo-csv">Upload de Arquivo CSV</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Arraste um arquivo CSV ou clique para selecionar
                      </p>
                      <p className="text-xs text-gray-500">
                        Formatos suportados: CSV com endereços ou coordenadas (latitude,longitude)
                      </p>
                    </div>
                    <Input
                      id="arquivo-csv"
                      type="file"
                      accept=".csv,.txt"
                      onChange={processarArquivoCSV}
                      className="mt-4 cursor-pointer"
                      disabled={loadingLote}
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <h4 className="font-medium text-blue-900 mb-2">Formato do Arquivo:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Para endereços: uma coluna com o endereço completo</li>
                      <li>• Para coordenadas: duas colunas (latitude,longitude)</li>
                      <li>• O sistema detecta automaticamente o formato</li>
                      <li>• Suporta cabeçalho na primeira linha</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {progresso > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso do processamento:</span>
                  <span>{progresso}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progresso}%` }}
                  ></div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {resultados.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Resultado da Busca ({resultados.length} {resultados.length === 1 ? 'item' : 'itens'})
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportarCSV}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {resultados.map((resultado, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg space-y-3 ${
                      resultado.codigoSetorCensitario === 'ERRO' 
                        ? 'bg-red-50 border border-red-200' 
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={resultado.codigoSetorCensitario === 'ERRO' ? 'destructive' : 'secondary'}>
                        Setor: {resultado.codigoSetorCensitario}
                      </Badge>
                      <Badge variant="outline">
                        {resultado.municipio}
                      </Badge>
                      {resultado.bairro && (
                        <Badge variant="outline">
                          {resultado.bairro}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p><strong>Local pesquisado:</strong> {resultado.enderecoPesquisado}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}