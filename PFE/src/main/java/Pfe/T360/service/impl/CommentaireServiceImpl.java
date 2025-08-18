package Pfe.T360.service.impl;

import Pfe.T360.dto.CommentaireDTO;
import Pfe.T360.dto.CommentaireRequestDTO;
import Pfe.T360.entity.Commentaire;
import Pfe.T360.entity.Post;
import Pfe.T360.entity.Notification;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.repository.CommentaireRepository;
import Pfe.T360.repository.PostRepository;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.service.CommentaireService;
import Pfe.T360.service.NotificationService;
import jakarta.persistence.EntityNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommentaireServiceImpl implements CommentaireService {

    @Autowired
    private CommentaireRepository commentaireRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private NotificationService notificationService;
    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Override
    public CommentaireDTO createCommentaire(CommentaireRequestDTO commentaireRequest) {
        Post post = postRepository.findById(commentaireRequest.getPostId())
                .orElseThrow(() -> new EntityNotFoundException("Post non trouvé"));
        
        Utilisateur utilisateur = utilisateurRepository.findById(commentaireRequest.getUtilisateurId())
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur non trouvé"));

        Commentaire commentaire = new Commentaire();
        commentaire.setContenu(commentaireRequest.getContenu());
        commentaire.setDate(LocalDateTime.now());
        commentaire.setPost(post);
        commentaire.setUtilisateur(utilisateur);

        Commentaire savedCommentaire = commentaireRepository.save(commentaire);

        // Envoi de notification
        if (!post.getAuteur().getId().equals(utilisateur.getId())) {
            notificationService.envoyerNotification(
                "Nouveau commentaire",
                utilisateur.getNom()+" " +utilisateur.getPrenom()+ " a commenté votre post.",
                Notification.TypeNotification.NOUVEAU_COMMENTAIRE,
                post.getId(),
                post.getAuteur(),
                utilisateur
            );
        }

        return convertToDTO(savedCommentaire);
    }

    @Override
    public List<CommentaireDTO> getCommentairesByPost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post non trouvé"));
        
        return commentaireRepository.findByPost(post).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public CommentaireDTO updateCommentaire(Long id, CommentaireRequestDTO commentaireRequest) {
        Commentaire existing = commentaireRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Commentaire non trouvé"));

        existing.setContenu(commentaireRequest.getContenu());
        Commentaire updated = commentaireRepository.save(existing);
        return convertToDTO(updated);
    }

    @Override
    public void deleteCommentaire(Long id) {
        if (!commentaireRepository.existsById(id)) {
            throw new EntityNotFoundException("Commentaire non trouvé");
        }
        commentaireRepository.deleteById(id);
    }

    private CommentaireDTO convertToDTO(Commentaire commentaire) {
        CommentaireDTO dto = new CommentaireDTO();
        dto.setId(commentaire.getId());
        dto.setContenu(commentaire.getContenu());
        dto.setDate(commentaire.getDate());
        dto.setPostId(commentaire.getPost().getId());
        dto.setUtilisateurId(commentaire.getUtilisateur().getId());
        dto.setUtilisateurNom(commentaire.getUtilisateur().getNom());
        dto.setUtilisateurPrenom(commentaire.getUtilisateur().getPrenom());
        return dto;
    }
}
