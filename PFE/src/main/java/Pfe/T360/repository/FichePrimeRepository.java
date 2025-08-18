package Pfe.T360.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import Pfe.T360.entity.FichePrime;
public interface FichePrimeRepository extends JpaRepository<FichePrime, Long> {
    List<FichePrime> findByUtilisateurId(Long utilisateurId);
}
