package Pfe.T360.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

@Data
public class PostDTO {
    private Long id;
    private String contenu;
    private Long auteurId;
    private String auteurNom;
    private String auteurPrenom;
    private LocalDateTime date;
    private List<FileDTO> medias;
   

   

    
}
