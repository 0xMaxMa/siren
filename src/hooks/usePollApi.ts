import { useCallback, useRef } from 'react'
import axios, { Method } from 'axios'
import { useQuery } from 'react-query'

const usePollApi = ({
  key,
  url,
  time,
  method,
  apiToken,
  params,
  payload,
  onMaxError,
  maxErrors = 3,
  isReady = true,
}: {
  key: string
  time: number
  isReady?: boolean
  url?: string
  apiToken?: string
  maxErrors?: number
  onMaxError?: () => void
  params?: { [key: string]: any }
  payload?: { [key: string]: any }
  method?: Method
}) => {
  const retries = useRef(0)

  const fetchApi = useCallback(async () => {
    if (!url) return

    // Fix for Error 414 URI Too Long
    // Add pagination for validatorInfo
    if (key == 'validatorInfo') {
      const pageSize = 300
      const keys = params?.id.split(',')
      let totalData: any = []

      for (let i = 0; i < keys.length; i += pageSize) {
        // Make new params
        params = {
          id: keys
            .slice(i, i + pageSize)
            .map((validator: string) => validator)
            .join(','),
        }

        const { data } = await axios({
          method,
          url,
          headers: apiToken ? { Authorization: `Bearer ${apiToken}` } : undefined,
          params,
          data: payload,
        })

        if (data && data.data) {
          if (i == 0) {
            totalData = data
          } else {
            totalData.data = [...totalData.data, ...data.data]
          }
        }
      }

      return totalData
    } else {
      const { data } = await axios({
        method,
        url,
        headers: apiToken ? { Authorization: `Bearer ${apiToken}` } : undefined,
        params,
        data: payload,
      })

      return data
    }
  }, [url, method, apiToken, params, payload])

  const { data } = useQuery(key, fetchApi, {
    enabled: isReady && retries.current < maxErrors,
    refetchInterval: time,
    retry: 3,
    cacheTime: 0,
    initialData: undefined,
    keepPreviousData: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    onError: () => {
      retries.current += 1
      if (retries.current >= maxErrors) {
        onMaxError?.()
      }
    },
  })

  return {
    data,
  }
}

export default usePollApi
