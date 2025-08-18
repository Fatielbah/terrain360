package Pfe.T360.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import Pfe.T360.entity.DemandeConge;
import Pfe.T360.entity.DemandeConge.TypeConge;
import java.util.List;

@Repository
public interface DemandeCongeRepository extends JpaRepository<DemandeConge, Long> {
    
    List<DemandeConge> findByType(TypeConge type);
    
    @Query("SELECT dc FROM DemandeConge dc WHERE dc.utilisateur.id = ?1 AND dc.statut = 'VALIDEE_DIRECTION'")
    List<DemandeConge> findValidatedByUser(Long userId);
    
    List<DemandeConge> findByUtilisateurIdAndDateDebutBetween(Long userId, LocalDate start, LocalDate end);
    List<DemandeConge> findByUtilisateurId(Long userId);
}