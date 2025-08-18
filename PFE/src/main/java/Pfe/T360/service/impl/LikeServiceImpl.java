package Pfe.T360.service.impl;

import Pfe.T360.dto.LikeDTO;
import Pfe.T360.dto.LikeDTO.LikeRequestDTO;
import Pfe.T360.entity.Like;
import Pfe.T360.entity.Post;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.entity.Notification;
import Pfe.T360.repository.LikeRepository;
import Pfe.T360.repository.PostRepository;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.service.LikeService;
import Pfe.T360.service.NotificationService;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityNotFoundException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class LikeServiceImpl implements LikeService {

    private final LikeRepository likeRepository;
    private final PostRepository postRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationService notificationService;

    public LikeServiceImpl(LikeRepository likeRepository, PostRepository postRepository, UtilisateurRepository utilisateurRepository,
    		NotificationService notificationService) {
        this.likeRepository = likeRepository;
        this.postRepository = postRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.notificationService =notificationService;
    }

    @Override
    public LikeDTO addLike(LikeRequestDTO likeRequest) {
        Post post = postRepository.findById(likeRequest.getPostId())
                .orElseThrow(() -> new EntityNotFoundException("Post non trouvé"));
        
        Utilisateur utilisateur = utilisateurRepository.findById(likeRequest.getUtilisateurId())
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur non trouvé"));

        // Vérification si le like existe déjà
        Optional<Like> existingLike = likeRepository.findByPostAndUtilisateur(post, utilisateur);
        if (existingLike.isPresent()) {
            return convertToLikeDTO(existingLike.get());
        }

        // Envoi de notification si l'auteur n'est pas celui qui like
        if (!post.getAuteur().getId().equals(utilisateur.getId())) {
            notificationService.envoyerNotification(
                "Nouveau like",
                utilisateur.getNom()+" "+utilisateur.getPrenom() + " a aimé votre publication",
                Notification.TypeNotification.NOUVEAU_LIKE,
                post.getId(),
                post.getAuteur(),
                utilisateur
            );
        }

        // Création du nouveau like
        Like like = new Like();
        like.setPost(post);
        like.setUtilisateur(utilisateur);
        like.setDate(LocalDateTime.now());
        
        Like savedLike = likeRepository.save(like);
        return convertToLikeDTO(savedLike);
    }

    @Override
    
    public void removeLike(LikeRequestDTO likeRequest) {
        Post post = postRepository.findById(likeRequest.getPostId())
                .orElseThrow(() -> new EntityNotFoundException("Post non trouvé"));
        
        Utilisateur utilisateur = utilisateurRepository.findById(likeRequest.getUtilisateurId())
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur non trouvé"));

        likeRepository.findByPostAndUtilisateur(post, utilisateur)
                .ifPresent(likeRepository::delete);
    }

    @Override
    
    public List<LikeDTO> getLikesByPost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post non trouvé"));
        
        return likeRepository.findByPost(post).stream()
                .map(this::convertToLikeDTO)
                .collect(Collectors.toList());
    }

    private LikeDTO convertToLikeDTO(Like like) {
        return new LikeDTO(
            like.getId(),
            like.getDate(),
            like.getPost().getId(),
            like.getUtilisateur().getId(),
            like.getUtilisateur().getNom()
        );
    }
}
