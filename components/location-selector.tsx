"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getCountries, getStatesByCountry, getCitiesByState, type Country, type State } from "@/lib/location-data"

interface LocationSelectorProps {
  value?: {
    country?: string
    state?: string
    city?: string
  }
  onChange: (location: { country: string; state: string; city: string }) => void
  disabled?: boolean
}

export function LocationSelector({ value, onChange, disabled }: LocationSelectorProps) {
  const [countries] = useState<Country[]>(getCountries())
  const [states, setStates] = useState<State[]>([])
  const [cities, setCities] = useState<string[]>([])

  const [selectedCountry, setSelectedCountry] = useState(value?.country || "")
  const [selectedState, setSelectedState] = useState(value?.state || "")
  const [selectedCity, setSelectedCity] = useState(value?.city || "")

  useEffect(() => {
    if (selectedCountry) {
      const countryStates = getStatesByCountry(selectedCountry)
      setStates(countryStates)

      // Reset state and city if country changes
      if (selectedCountry !== value?.country) {
        setSelectedState("")
        setSelectedCity("")
        setCities([])
      }
    } else {
      setStates([])
      setCities([])
    }
  }, [selectedCountry, value?.country])

  useEffect(() => {
    if (selectedCountry && selectedState) {
      const stateCities = getCitiesByState(selectedCountry, selectedState)
      setCities(stateCities)

      // Reset city if state changes
      if (selectedState !== value?.state) {
        setSelectedCity("")
      }
    } else {
      setCities([])
    }
  }, [selectedCountry, selectedState, value?.state])

  useEffect(() => {
    if (selectedCountry && selectedState && selectedCity) {
      const countryName = countries.find((c) => c.code === selectedCountry)?.name || ""
      const stateName = states.find((s) => s.code === selectedState)?.name || ""

      onChange({
        country: countryName,
        state: stateName,
        city: selectedCity,
      })
    }
  }, [selectedCountry, selectedState, selectedCity, countries, states, onChange])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Country</Label>
        <Select value={selectedCountry} onValueChange={setSelectedCountry} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>State/Province</Label>
        <Select
          value={selectedState}
          onValueChange={setSelectedState}
          disabled={disabled || !selectedCountry || states.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select state/province" />
          </SelectTrigger>
          <SelectContent>
            {states.map((state) => (
              <SelectItem key={state.code} value={state.code}>
                {state.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>City</Label>
        <Select
          value={selectedCity}
          onValueChange={setSelectedCity}
          disabled={disabled || !selectedState || cities.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
