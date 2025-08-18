package Pfe.T360.entity;

import java.util.List;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
@Entity
@Data
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Lob
    private String contenu;

    private LocalDateTime date;

    @ManyToOne
    private Utilisateur auteur;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL)
    private List<File> medias;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL)
    private List<Commentaire> commentaires;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL)
    private List<Vue> vues;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL)
    private List<Like> likes;
}
