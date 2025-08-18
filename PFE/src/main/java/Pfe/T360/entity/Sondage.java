package Pfe.T360.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
public class Sondage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String question;

    private LocalDateTime date;

    
    @ManyToOne
    private Utilisateur auteur;

    @OneToMany(mappedBy = "sondage", cascade = CascadeType.ALL)
    private List<Option> options;
}
