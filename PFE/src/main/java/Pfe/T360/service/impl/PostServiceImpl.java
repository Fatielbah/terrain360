package Pfe.T360.service.impl;

import Pfe.T360.dto.PostDTO;
import Pfe.T360.dto.FileDTO;
import Pfe.T360.entity.File;
import Pfe.T360.entity.Notification;
import Pfe.T360.entity.Post;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.repository.FileRepository;
import Pfe.T360.repository.PostRepository;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.service.NotificationService;
import Pfe.T360.service.PostService;
import Pfe.T360.util.FileUtils;
import java.io.IOException;
import java.time.LocalDateTime;

import org.slf4j.Logger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;

import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.List;

@Service
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final NotificationService notificationService;
    private final UtilisateurRepository utilisateurRepository;
    private final FileRepository fileRepository;

    @Autowired
    public PostServiceImpl(PostRepository postRepository, NotificationService notificationService,
    		UtilisateurRepository utilisateurRepository,FileRepository fileRepository) {
        this.postRepository = postRepository;
        this.notificationService = notificationService;
        this.utilisateurRepository= utilisateurRepository;
        this.fileRepository =fileRepository;
    }

    @Override
    public List<PostDTO> getAllPosts() {
    	return postRepository.findAll()
                .stream()
                .map(this::toDTO)  // Post → PostDTO
                .collect(Collectors.toList());
    }

        public  PostDTO toDTO(Post post) {
            PostDTO dto = new PostDTO();
            dto.setId(post.getId());
            dto.setContenu(post.getContenu());
            dto.setAuteurId(post.getAuteur().getId());
            dto.setAuteurNom(post.getAuteur().getNom());
            dto.setAuteurPrenom(post.getAuteur().getPrenom());
            dto.setDate(post.getDate());

            if (post.getMedias() != null) {
                dto.setMedias(
                    post.getMedias().stream()
                        .map(this::toFileDTO)
                        .collect(Collectors.toList())
                );
            }

            return dto;
        }

        public FileDTO toFileDTO(File file) {
            FileDTO dto = new FileDTO();
            dto.setId(file.getId());
            dto.setName(file.getName());
            dto.setType(file.getType());
            dto.setUrl(file.getFileData()); // lien direct
            return dto;
        }
    


    @Override
    public Post getPostById(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post non trouvé"));
    }

   
   
    @Transactional
    public PostDTO createPost(PostDTO postDTO, List<MultipartFile> medias) throws IOException {
        // 1. Validation des entrées
        if (postDTO == null) {
            throw new IllegalArgumentException("Le post ne peut pas être null");
        }
        
        if (postDTO.getAuteurId() == null) {
            throw new IllegalArgumentException("L'auteur du post doit être spécifié");
        }

        // 2. Conversion DTO -> Entité
        Post post = new Post();
        post.setContenu(postDTO.getContenu());
        post.setDate(LocalDateTime.now());
        
        // 3. Chargement de l'auteur
        Utilisateur auteur = utilisateurRepository.findById(postDTO.getAuteurId())
            .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable avec l'ID: " + postDTO.getAuteurId()));
        
        post.setAuteur(auteur);

        // 4. Sauvegarde initiale du post
        Post savedPost = postRepository.save(post);

        // 5. Traitement des médias
        List<File> savedMedias = processMediaFiles(medias, savedPost);
        savedPost.setMedias(savedMedias);
        postRepository.save(savedPost);

        // 6. Envoi des notifications
        sendNotificationsToRecipients(savedPost, auteur);

        // 7. Conversion en DTO pour la réponse
        return toDTO(savedPost);
    }

   

    

    

    private List<File> processMediaFiles(List<MultipartFile> medias, Post post) throws IOException {
        List<File> savedMedias = new ArrayList<>();
        
        if (medias != null && !medias.isEmpty()) {
            for (MultipartFile media : medias) {
                if (media != null && !media.isEmpty()) {
                    try {
                        File mediaFile = createMediaFile(media, post);
                        File savedFile = fileRepository.save(mediaFile);
                        savedMedias.add(savedFile);
                    } catch (IOException e) {
                        throw new IOException("Échec du traitement du fichier: " + media.getOriginalFilename(), e);
                    }
                }
            }
        }
        return savedMedias;
    }

    private File createMediaFile(MultipartFile media, Post post) throws IOException {
        return File.builder()
                .name(media.getOriginalFilename())
                .type(media.getContentType())
                .fileData(FileUtils.compressFile(media.getBytes()))
                .post(post)
                .build();
    }

    private void sendNotificationsToRecipients(Post post, Utilisateur auteur) {
        List<Utilisateur> recipients = utilisateurRepository.findAll()
                .stream()
                .filter(u -> !u.getId().equals(auteur.getId()))
                .collect(Collectors.toList());

        recipients.forEach(recipient -> {
            notificationService.envoyerNotification(
                "Nouveau post de " + auteur.getNom()+" "+auteur.getPrenom(),
                "Un nouveau post a été publié par " + auteur.getNom()+" "+auteur.getPrenom(),
                Notification.TypeNotification.NOUVEAU_POST,
                post.getId(),
                recipient,
                auteur
            );
        });
    }

    @Override
    @Transactional
    public PostDTO updatePost(Long id, PostDTO postUpdateDTO) {
        // 1. Validation des entrées
        if (id == null) {
            throw new IllegalArgumentException("L'ID du post ne peut pas être null");
        }
        
        if (postUpdateDTO == null) {
            throw new IllegalArgumentException("Les données de mise à jour ne peuvent pas être null");
        }

        // 2. Récupération du post existant
        Post existingPost = postRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Post introuvable avec l'ID: " + id));

       

        // 4. Mise à jour des champs modifiables
        if (postUpdateDTO.getContenu() != null) {
            existingPost.setContenu(postUpdateDTO.getContenu());
        }
        
        existingPost.setDate(LocalDateTime.now());

        // 5. Sauvegarde
        Post updatedPost = postRepository.save(existingPost);

        // 6. Conversion en DTO pour la réponse
        return toDTO(updatedPost);
    }
    @Override
    public void deletePost(Long id) {
        postRepository.deleteById(id);
    }
}
