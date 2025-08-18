package Pfe.T360.repository;


import Pfe.T360.entity.Sondage;
import Pfe.T360.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SondageRepository extends JpaRepository<Sondage, Long> {
    List<Sondage> findByAuteur(Utilisateur auteur);
}
