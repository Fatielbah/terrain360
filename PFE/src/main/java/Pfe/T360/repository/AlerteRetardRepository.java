package Pfe.T360.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import Pfe.T360.entity.AlerteRetard;
import Pfe.T360.entity.Retard;
import Pfe.T360.entity.Utilisateur;

public interface AlerteRetardRepository extends JpaRepository<AlerteRetard, Long> {
    List<AlerteRetard> findByUtilisateur(Utilisateur utilisateur);
    
    boolean existsByUtilisateurAndDateGenerationAfter(Utilisateur utilisateur, LocalDate date);
    public List<Retard> getRetardsByUtilisateur(Utilisateur utilisateur);
    public List<AlerteRetard> getAlertesByUtilisateur(Utilisateur utilisateur);
    List<AlerteRetard> findByUtilisateurAndDateGenerationAfter(Utilisateur utilisateur,LocalDate dateLimite);
}