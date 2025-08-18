package Pfe.T360.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import Pfe.T360.entity.Services;
import java.util.Optional;
@Repository
public interface ServiceRepository extends JpaRepository<Services, Long> {
    Optional<Services> findByNom(String nom);
}