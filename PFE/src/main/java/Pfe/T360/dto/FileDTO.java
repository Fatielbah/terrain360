package Pfe.T360.dto;

import jakarta.persistence.Lob;
import lombok.Data;

@Data
public class FileDTO {
    private Long id;
    private String name;
    private String type;
    @Lob
    private byte[] url; 

   
}