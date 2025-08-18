package Pfe.T360.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
@Data
@Entity
public class Commentaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Lob
    private String contenu;

    private LocalDateTime date;

    @ManyToOne
    private Post post;

    @ManyToOne
    private Utilisateur utilisateur;
}

