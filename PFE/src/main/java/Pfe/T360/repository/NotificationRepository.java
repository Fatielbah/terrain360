package Pfe.T360.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import Pfe.T360.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByDestinataireIdAndLueFalseOrderByDateCreationDesc(Long utilisateurId);
    
    long countByDestinataireIdAndLueFalse(Long utilisateurId);
}
