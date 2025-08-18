package Pfe.T360.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SondageUpdateDTO {
    @Size(max = 500, message = "La question ne peut dépasser 500 caractères")
    private String question;
    
    @Valid
    private List<OptionUpdateDTO> options;
}

