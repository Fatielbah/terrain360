package Pfe.T360.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

@Data
public class SondageDTO {

    private Long id;
    private String question;
    private LocalDateTime date;
    private long auteurId;
    private List<OptionDTO> options;

    @Data
    public static class OptionDTO {
        private Long id;
        private String texte;
        private List<VoteDTO> votesDetails;  // liste des votes (détails)
    }

    @Data
    public static class VoteDTO {
        private Long id;
        private Long utilisateurId;
        private String utilisateurNom;
    }
}

