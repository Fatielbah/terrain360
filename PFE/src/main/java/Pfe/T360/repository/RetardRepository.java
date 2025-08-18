package Pfe.T360.repository;

import Pfe.T360.entity.AlerteRetard;
import Pfe.T360.entity.Retard;
import Pfe.T360.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface RetardRepository extends JpaRepository<Retard, Long> {
    List<Retard> findByUtilisateur(Utilisateur utilisateur);
    
    @Query("SELECT r FROM Retard r WHERE r.utilisateur = :utilisateur AND r.date >= :date AND r.justifie = false")
    List<Retard> findByUtilisateurAndDateAfterAndJustifieFalse(
        @Param("utilisateur") Utilisateur utilisateur, 
        @Param("date") LocalDate date);
}

