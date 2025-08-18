package Pfe.T360.service.impl;

import Pfe.T360.dto.IAResponse;
import Pfe.T360.service.IAService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

@Service
public class IAServiceImpl implements IAService {

    private static final Logger log = Logger.getLogger(IAServiceImpl.class.getName());

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public IAServiceImpl(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder()
                .baseUrl("http://localhost:11434")
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    @Override
    public IAResponse callAI(String prompt) {
        String fullPrompt = """
            Analysez ce CV par rapport à la fiche de poste et fournissez une réponse au format JSON strict :
            {
                "score": [nombre entre 0 et 100],
                "commentaire": "[explication détaillée]",
                "competences_trouvees": ["compétence1", "compétence2"],
                "competences_manquantes": ["compétence3", "compétence4"],
                "points_forts": ["point1", "point2"],
                "recommandations": ["recommandation1", "recommandation2"]
            }

            """ + prompt;

        Map<String, Object> requestBody = Map.of(
        	    "model", "llama3.2",
        	    "prompt", fullPrompt,
        	    "stream", false
        	);


        try {
            String responseContent = webClient.post()
                    .uri("/api/generate")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(60))
                    .block();

            // ✅ Debug : afficher réponse brute
            System.out.println("Réponse Ollama brute : " + responseContent);

            JsonNode rootNode = objectMapper.readTree(responseContent);
            String content = rootNode.path("response").asText();

            // Le modèle répond avec du texte JSON, on le parse
            JsonNode json = objectMapper.readTree(content);

            return new IAResponse(
                    json.path("score").asInt(),
                    json.path("commentaire").asText(),
                    objectMapper.convertValue(json.path("competences_trouvees"), String[].class),
                    objectMapper.convertValue(json.path("competences_manquantes"), String[].class),
                    objectMapper.convertValue(json.path("points_forts"), String[].class),
                    objectMapper.convertValue(json.path("recommandations"), String[].class)
            );

        } catch (Exception e) {
            log.severe("Erreur Ollama : " + e.getMessage());
            return new IAResponse(0, "Erreur lors de l'analyse : " + e.getMessage());
        }
    }
}
