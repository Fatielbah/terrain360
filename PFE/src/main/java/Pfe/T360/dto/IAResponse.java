package Pfe.T360.dto;

import lombok.Data;

@Data
public class IAResponse {
    private int score;
    private String commentaire;
    private String[] competencesTrouvees;
    private String[] competencesManquantes;
    private String[] pointsForts;
    private String[] recommandations;

    public IAResponse(int score, String commentaire) {
        this(score, commentaire, new String[0], new String[0], new String[0], new String[0]);
    }

    public IAResponse(int score, String commentaire, 
                     String[] competencesTrouvees, String[] competencesManquantes,
                     String[] pointsForts, String[] recommandations) {
        this.score = score;
        this.commentaire = commentaire;
        this.competencesTrouvees = competencesTrouvees;
        this.competencesManquantes = competencesManquantes;
        this.pointsForts = pointsForts;
        this.recommandations = recommandations;
    }
}