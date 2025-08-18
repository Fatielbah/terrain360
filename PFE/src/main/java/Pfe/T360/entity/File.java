package Pfe.T360.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "FileData")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class File{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String type;
    @Lob
    @Column(name = "filedata", columnDefinition = "LONGBLOB")
    private byte[] fileData;
    @ManyToOne
    @JoinColumn(name = "post_id")
    private Post post;
}