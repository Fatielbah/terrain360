package Pfe.T360.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import Pfe.T360.entity.FichePaie;

public interface FichePaieRepository extends JpaRepository<FichePaie, Long> {
    List<FichePaie> findByUtilisateurId(Long utilisateurId);
}

