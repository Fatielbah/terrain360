package Pfe.T360.repository;


import Pfe.T360.entity.Post;
import Pfe.T360.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByAuteur(Utilisateur auteur);
}
