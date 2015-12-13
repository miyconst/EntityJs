using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace EntityJs.EF6.Models
{
    public partial class Product : EntityJs.Client.Objects.IEntity
    {
        public int MaxCategoryID
        {
            get
            {
                if (this.Category == null)
                {
                    return 0;
                }

                return this.Category.Products.Any() ? this.Category.Products.Max(x => x.ID) : 0;
            }
        }

        public string PhotoName
        {
            get
            {
                if (this.Photo == null)
                {
                    return string.Empty;
                }

                return this.Photo.Name;
            }
        }

        public string PhotoVirtualPath
        {
            get
            {
                if (this.Photo == null)
                {
                    return string.Empty;
                }

                return this.Photo.VirtualPath;
            }
        }

        public string BigPhotoName
        {
            get
            {
                if (this.BigPhoto == null)
                {
                    return string.Empty;
                }

                return this.BigPhoto.Name;
            }
        }

        public string BigPhotoVirtualPath
        {
            get
            {
                if (this.BigPhoto == null)
                {
                    return string.Empty;
                }

                return this.BigPhoto.VirtualPath;
            }
        }

        public object ToJson()
        {
            return new
            {
                this.ID,
                this.Name,
                this.CategoryID,
                this.FullName,
                this.Price,
                this.PhotoID,
                this.PhotoName,
                this.PhotoVirtualPath,
                this.BigPhotoID,
                this.BigPhotoName,
                this.BigPhotoVirtualPath,
                this.Date,
                this.MaxCategoryID
            };
        }

        public void OnCheckPermissions(Client.Events.CheckPermissionsEventArgs e)
        {
            e.Cancel = false;
        }

        public void OnSelecting(Client.Events.EntityEventArgs e)
        {
        }

        public void OnInserting(Client.Events.EntityEventArgs e)
        {
        }

        public void OnUpdating(Client.Events.EntityEventArgs e)
        {
            if (e.Values.ContainsKey("PhotoID") && e.Values["PhotoID"] == null && this.Photo != null)
            {
                this.Photo.RemoveFile();
                e.Context.Set(Photo.GetType()).Remove(this.Photo);
                this.PhotoID = null;
            }

            if (e.Values.ContainsKey("BigPhotoID") && this.BigPhoto != null && e.Values["BigPhotoID"] as string != this.BigPhotoID.ToString())
            {
                this.BigPhoto.RemoveFile();
                e.Context.Set(BigPhoto.GetType()).Remove(this.BigPhoto);
            }
        }

        public void OnDeleting(Client.Events.EntityEventArgs e)
        {
        }

        public void OnSelected(Client.Events.EntityEventArgs e)
        {
        }

        public void OnInserted(Client.Events.EntityEventArgs e)
        {
        }

        public void OnUpdated(Client.Events.EntityEventArgs e)
        {
        }

        public void OnDeleted(Client.Events.EntityEventArgs e)
        {
        }
    }
}