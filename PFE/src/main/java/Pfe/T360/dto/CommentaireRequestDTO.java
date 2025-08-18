package Pfe.T360.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CommentaireRequestDTO {
    @NotBlank(message = "Le contenu ne peut pas être vide")
    private String contenu;
    
    @NotNull(message = "L'ID du post est obligatoire")
    private Long postId;
    
    @NotNull(message = "L'ID de l'utilisateur est obligatoire")
    private Long utilisateurId;
}