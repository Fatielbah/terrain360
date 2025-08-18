package Pfe.T360.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import Pfe.T360.entity.FicheDePoste;

public interface FicheDePosteRepository extends JpaRepository<FicheDePoste, Long> {
    List<FicheDePoste> findByService(String Service);
    @Query("SELECT f.titre FROM FicheDePoste f WHERE f.id = :id")
    String findTitreById(@Param("id") Long id);
}
