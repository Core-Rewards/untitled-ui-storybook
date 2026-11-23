import { useState } from "react";
import { File04, Trash01, UploadCloud02 } from "@untitledui/icons";
import { DropZone, FileTrigger } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { useSurveyCopy } from "../survey-context";
import type { FileUploadQuestion, UploadedFile } from "../survey-types";
import type { QuestionInputProps } from "./question-input-types";

const formatSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

const typeLabel = (types?: string[]) =>
    types?.length
        ? types.map((t) => (t.endsWith("/*") ? t.replace("/*", "s") : (t.split("/")[1] ?? t).toUpperCase().replace("JPEG", "JPG"))).join(", ")
        : "Files";

const matchesType = (file: File, accepted?: string[]) =>
    !accepted?.length || accepted.some((t) => (t.endsWith("/*") ? file.type.startsWith(t.slice(0, -1)) : file.type === t));

/**
 * Drop or choose files. In Storybook files are only listed, not uploaded; the
 * platform uploads each file and stores the returned id as the answer.
 */
export const FileUploadInput = ({ question, value, onChange, labelId, messageId }: QuestionInputProps<FileUploadQuestion, UploadedFile[]>) => {
    const { copy } = useSurveyCopy();
    const files = value ?? [];
    const maxMb = question.maxSizeMb ?? 10;
    const maxFiles = question.maxFiles ?? 1;
    const [errors, setErrors] = useState<string[]>([]);

    const add = (incoming: File[]) => {
        const problems: string[] = [];
        const accepted: UploadedFile[] = [];
        for (const file of incoming) {
            if (!matchesType(file, question.acceptedTypes)) problems.push(copy.fileWrongType(file.name));
            else if (file.size > maxMb * 1024 * 1024) problems.push(copy.fileTooBig(file.name, maxMb));
            else
                accepted.push({
                    id: `${file.name}-${file.size}-${file.lastModified}`,
                    name: file.name,
                    sizeBytes: file.size,
                    type: file.type,
                });
        }
        const room = maxFiles - files.length;
        if (accepted.length > room) problems.push(copy.tooManyFiles(maxFiles));
        setErrors(problems);
        const next = [...files, ...accepted.slice(0, Math.max(0, room))];
        if (next.length !== files.length) onChange(next);
    };

    return (
        <div className="flex flex-col gap-3 @xl/survey:max-w-120">
            <DropZone
                aria-labelledby={labelId}
                isDisabled={files.length >= maxFiles}
                onDrop={async (e) => {
                    const dropped = await Promise.all(
                        e.items.filter((item) => item.kind === "file").map((item) => (item as { getFile: () => Promise<File> }).getFile()),
                    );
                    add(dropped);
                }}
                className={({ isDropTarget, isDisabled }) =>
                    cx(
                        "flex flex-col items-center gap-3 rounded-xl bg-primary px-6 py-6 text-center ring-1 ring-primary ring-inset",
                        isDropTarget && "bg-brand-primary ring-2 ring-brand",
                        isDisabled && "opacity-50",
                    )
                }
            >
                <span className="flex size-10 items-center justify-center rounded-lg ring-1 ring-primary ring-inset">
                    <UploadCloud02 className="size-5 text-fg-secondary" aria-hidden="true" />
                </span>
                <span className="hidden text-sm text-tertiary pointer-fine:inline">{copy.dropFiles}</span>
                <FileTrigger allowsMultiple={maxFiles > 1} acceptedFileTypes={question.acceptedTypes} onSelect={(list) => list && add(Array.from(list))}>
                    <Button color="secondary" size="md" isDisabled={files.length >= maxFiles}>
                        {copy.browseFiles}
                    </Button>
                </FileTrigger>
                <span className="text-xs text-tertiary">{copy.fileLimits(typeLabel(question.acceptedTypes), maxMb)}</span>
            </DropZone>

            {errors.length > 0 && (
                <ul id={messageId} role="status" className="flex flex-col gap-1 text-sm text-error-primary">
                    {errors.map((e) => (
                        <li key={e}>{e}</li>
                    ))}
                </ul>
            )}

            {files.length > 0 && (
                <ul className="flex flex-col gap-2">
                    {files.map((file) => (
                        <li key={file.id} className="flex items-center gap-3 rounded-xl bg-primary px-3 py-2 ring-1 ring-secondary ring-inset">
                            <File04 className="size-6 shrink-0 text-fg-quaternary" aria-hidden="true" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-primary">{file.name}</p>
                                <p className="text-xs text-tertiary">{formatSize(file.sizeBytes)}</p>
                            </div>
                            <button
                                type="button"
                                aria-label={copy.removeFile(file.name)}
                                onClick={() => onChange(files.filter((f) => f.id !== file.id).length ? files.filter((f) => f.id !== file.id) : undefined)}
                                className="flex size-10 cursor-pointer items-center justify-center rounded-lg text-fg-quaternary outline-hidden hover:bg-primary_hover focus-visible:ring-2 focus-visible:ring-brand"
                            >
                                <Trash01 className="size-5" aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
