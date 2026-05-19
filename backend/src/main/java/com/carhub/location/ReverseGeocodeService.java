package com.carhub.location;

import com.carhub.common.BusinessRuleException;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

@Service
public class ReverseGeocodeService {
    private final RestClient restClient;

    public ReverseGeocodeService(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder
                .defaultHeader(HttpHeaders.USER_AGENT, "CarHub/0.1 contact: support@carhub.local")
                .build();
    }

    public ReverseGeocodeResponse reverse(String latitude, String longitude) {
        String url = UriComponentsBuilder.fromUriString("https://nominatim.openstreetmap.org/reverse")
                .queryParam("format", "jsonv2")
                .queryParam("lat", latitude)
                .queryParam("lon", longitude)
                .queryParam("addressdetails", 1)
                .build()
                .toUriString();

        NominatimResponse response = restClient.get()
                .uri(url)
                .retrieve()
                .body(NominatimResponse.class);

        if (response == null || response.displayName() == null || response.displayName().isBlank()) {
            throw new BusinessRuleException("LOCATION_NOT_FOUND", "Could not find an address for this location.");
        }

        Map<String, String> address = response.address() == null ? Map.of() : response.address();
        String area = firstPresent(address, "suburb", "neighbourhood", "quarter", "village", "town", "city_district", "county");
        String city = firstPresent(address, "city", "town", "village", "municipality", "county");
        return new ReverseGeocodeResponse(
                response.displayName(),
                area,
                city,
                address.get("state"),
                address.get("postcode"),
                latitude,
                longitude
        );
    }

    @SafeVarargs
    private final String firstPresent(Map<String, String> values, String... keys) {
        for (String key : keys) {
            String value = values.get(key);
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private record NominatimResponse(@JsonProperty("display_name") String displayName, Map<String, String> address) {
    }
}
