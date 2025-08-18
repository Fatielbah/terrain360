package Pfe.T360.repository;

import Pfe.T360.entity.Conge;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CongeRepository extends JpaRepository<Conge, Long> {
    List<Conge> findByUtilisateurId(Long utilisateurId);
}