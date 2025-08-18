package Pfe.T360.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OptionUpdateDTO {
    private Long id;  // null pour une nouvelle option
    
    @NotBlank(message = "Le texte de l'option ne peut être vide")
    @Size(max = 200, message = "Le texte de l'option ne peut dépasser 200 caractères")
    private String texte;
}