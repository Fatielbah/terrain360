package Pfe.T360.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CommentaireDTO {
    private Long id;
    private String contenu;
    private LocalDateTime date;
    private Long postId;
    private Long utilisateurId;
    private String utilisateurNom;
    private String utilisateurPrenom;
}