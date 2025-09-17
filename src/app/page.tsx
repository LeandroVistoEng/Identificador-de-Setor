'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { MapPin, Navigation, Download } from 'lucide-react'

interface SearchResult {
  codigoSetorCensitario: string
  municipio: string
  bairro?: string
  enderecoPesquisado: string
}

export default function Home() {
  const [endereco, setEndereco] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultados, setResultados] = useState<SearchResult[]>([])
  const [error, setError] = useState('')

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
      <div className="max-w-4xl mx-auto space-y-6">
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
                  Resultado da Busca
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
              <div className="space-y-4">
                {resultados.map((resultado, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
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