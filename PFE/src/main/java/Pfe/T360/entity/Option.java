package Pfe.T360.entity;



import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "options")
public class Option {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String texte;

    @OneToMany(mappedBy = "option", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Vote> votes= new ArrayList<>();;

    @JsonIgnore
    @ManyToOne
    private Sondage sondage;
}
